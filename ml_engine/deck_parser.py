import io
import re
from typing import Dict, Any, Tuple, Optional, List
import PyPDF2
from PIL import Image

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False

# Mapping of canonical feature keys to default values in the 44-dimensional space
DEFAULT_44D_METRICS: Dict[str, float] = {
    "mrr": 15000.0,
    "monthly_burn_rate": 25000.0,
    "founder_experience_years": 4.0,
    "runway_months": 14.0,
    "team_size": 6.0,
    "cac": 450.0,
    "ltv": 1800.0,
    "churn_rate": 0.035,
    "net_promoter_score": 52.0,
    "gross_margin": 0.78,
    "growth_rate_mom": 0.12,
    "cash_balance": 350000.0,
    "total_capital_raised": 500000.0,
    "previous_exits": 0.0,
    "technical_founders_count": 1.0,
    "patent_count": 0.0,
    "market_tam_billions": 8.5,
    "market_growth_cagr": 0.18,
    "competitor_density": 0.45,
    "product_market_fit_score": 0.72,
    "sales_cycle_days": 35.0,
    "payback_period_months": 7.5,
    "revenue_concentration_top3": 0.22,
    "lead_conversion_rate": 0.048,
    "organic_traffic_ratio": 0.58,
    "active_users_dau_mau_ratio": 0.42,
    "headcount_engineering_ratio": 0.50,
    "headcount_sales_ratio": 0.25,
    "advisory_board_strength": 0.65,
    "investor_tier_score": 0.75,
    "regulatory_risk_score": 0.20,
    "macroeconomic_sensitivity": 0.30,
    "pricing_power_index": 0.68,
    "net_revenue_retention": 1.15,
    "virality_coefficient_k_factor": 0.35,
    "domain_expertise_alignment": 0.85,
    "hiring_velocity_time_to_fill_days": 42.0,
    "esop_pool_percentage": 0.12,
    "debt_to_equity_ratio": 0.05,
    "ip_defensibility_score": 0.60,
    "b2b_enterprise_contract_ratio": 0.40,
    "founder_equity_retention": 0.75,
    "customer_concentration_risk": 0.18,
    "operational_efficiency_ratio": 0.74,
}

def parse_currency_value(val_str: str) -> Optional[float]:
    """Parse strings like '$25k', '$1.2M', '500,000', '45K' into standard floats."""
    if not val_str:
        return None
    cleaned = val_str.replace("$", "").replace(",", "").strip().lower()
    multiplier = 1.0
    if cleaned.endswith("k"):
        multiplier = 1_000.0
        cleaned = cleaned[:-1]
    elif cleaned.endswith("m") or cleaned.endswith("mn"):
        multiplier = 1_000_000.0
        cleaned = cleaned.rstrip("mn")
    elif cleaned.endswith("b") or cleaned.endswith("bn"):
        multiplier = 1_000_000_000.0
        cleaned = cleaned.rstrip("bn")
    try:
        return float(cleaned.strip()) * multiplier
    except ValueError:
        return None

def parse_percentage_value(val_str: str) -> Optional[float]:
    """Parse percentages like '3.5%', '15%' into decimals (0.035, 0.15)."""
    if not val_str:
        return None
    cleaned = val_str.replace("%", "").strip()
    try:
        val = float(cleaned)
        return val / 100.0 if val > 1.0 else val
    except ValueError:
        return None

class PitchDeckParser:
    """
    Ingests PDF pitch decks or images, runs OCR and regex NLP extraction to detect
    financial and operational startup indicators, and maps them to the 44-D vector.
    """

    @classmethod
    def extract_text_from_pdf(cls, file_bytes: bytes) -> Tuple[str, int]:
        """Extracts native text from PDF pages using PyPDF2."""
        text_content = []
        page_count = 0
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text_content.append(f"--- Page {i+1} ---\n{page_text}")
        except Exception as e:
            text_content.append(f"PDF extraction warning: {str(e)}")

        full_text = "\n".join(text_content)
        return full_text, page_count

    @classmethod
    def extract_text_via_ocr(cls, image_bytes: bytes) -> str:
        """Fallback OCR extraction for scanned slide images using pytesseract."""
        if not HAS_PYTESSERACT:
            return ""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            return pytesseract.image_to_string(image)
        except Exception:
            return ""

    @classmethod
    def extract_metrics_nlp(cls, raw_text: str) -> Tuple[Dict[str, float], Dict[str, float], List[str]]:
        """
        Parses extracted pitch deck text using NLP pattern matching.
        Returns:
          - extracted_metrics: detected values mapped to canonical feature names
          - confidence_scores: confidence in detection (0.0 to 1.0)
          - highlights: human-readable extracted facts
        """
        extracted: Dict[str, float] = {}
        confidences: Dict[str, float] = {}
        highlights: List[str] = []

        lower_text = raw_text.lower()

        # 1. MRR Extraction (e.g., "$25k MRR", "MRR: $40,000", "Monthly Recurring Revenue of $18K")
        mrr_match = re.search(r'(?:mrr|monthly\s+recurring\s+revenue)[\s\:\=]*\$?\s*([0-9\.\,]+\s*[kmb]?)', lower_text)
        if not mrr_match:
            mrr_match = re.search(r'\$\s*([0-9\.\,]+\s*[kmb]?)\s*(?:mrr|monthly\s+recurring\s+revenue)', lower_text)
        if mrr_match:
            val = parse_currency_value(mrr_match.group(1))
            if val and val > 100:
                extracted["mrr"] = val
                confidences["mrr"] = 0.92
                highlights.append(f"MRR detected: ${val:,.0f}/mo")

        # ARR fallback for MRR (e.g., "$600k ARR" -> $50k MRR)
        if "mrr" not in extracted:
            arr_match = re.search(r'(?:arr|annual\s+recurring\s+revenue)[\s\:\=]*\$?\s*([0-9\.\,]+\s*[kmb]?)', lower_text)
            if not arr_match:
                arr_match = re.search(r'\$\s*([0-9\.\,]+\s*[kmb]?)\s*(?:arr|annual\s+recurring\s+revenue)', lower_text)
            if arr_match:
                val = parse_currency_value(arr_match.group(1))
                if val and val > 1000:
                    calculated_mrr = val / 12.0
                    extracted["mrr"] = calculated_mrr
                    confidences["mrr"] = 0.85
                    highlights.append(f"Derived MRR from ARR (${val:,.0f}): ${calculated_mrr:,.0f}/mo")

        # 2. Monthly Burn Rate (e.g., "Monthly burn: $35k", "Burn rate of $45,000", "$30k burn")
        burn_match = re.search(r'(?:monthly\s+burn|burn\s+rate|gross\s+burn)[\s\:\=]*\$?\s*([0-9\.\,]+\s*[kmb]?)', lower_text)
        if not burn_match:
            burn_match = re.search(r'\$\s*([0-9\.\,]+\s*[kmb]?)\s*(?:monthly\s+burn|burn\s+rate)', lower_text)
        if burn_match:
            val = parse_currency_value(burn_match.group(1))
            if val and val > 500:
                extracted["monthly_burn_rate"] = val
                confidences["monthly_burn_rate"] = 0.90
                highlights.append(f"Burn rate detected: ${val:,.0f}/mo")

        # 3. Cash Runway (e.g., "18 months runway", "Runway: 14 mos", "12 mo runway")
        runway_match = re.search(r'(?:runway)[\s\:\=]*([0-9]+(?:\.[0-9]+)?)\s*(?:months|mo|mos)', lower_text)
        if not runway_match:
            runway_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:months|mo|mos)\s*(?:of\s+)?runway', lower_text)
        if runway_match:
            try:
                runway_val = float(runway_match.group(1))
                if 1 <= runway_val <= 60:
                    extracted["runway_months"] = runway_val
                    confidences["runway_months"] = 0.95
                    highlights.append(f"Runway detected: {runway_val:.0f} months")
            except ValueError:
                pass

        # 4. Total Capital Raised / Round Size (e.g., "Raising $1.5M", "Raised $500k", "Seed round $2M")
        capital_match = re.search(r'(?:raising|raised|total\s+funding|seed\s+round)[\s\:\=]*\$?\s*([0-9\.\,]+\s*[kmb]?)', lower_text)
        if capital_match:
            val = parse_currency_value(capital_match.group(1))
            if val and val > 10000:
                extracted["total_capital_raised"] = val
                confidences["total_capital_raised"] = 0.88
                highlights.append(f"Capital detected: ${val:,.0f}")

        # 5. Team Size / Headcount (e.g., "Team of 8", "Team: 8", "12 full-time employees", "8 FTEs")
        team_match = re.search(r'(?:team(?:\s+of|\s+size|\s+is)?[\s\:\=]*|headcount[\s\:\=]*)\s*([0-9]+)', lower_text)
        if not team_match:
            team_match = re.search(r'([0-9]+)\s*(?:fte|ftes|employees|members|engineers|people)', lower_text)
        if team_match:
            try:
                team_val = float(team_match.group(1))
                if 1 <= team_val <= 200:
                    extracted["team_size"] = team_val
                    confidences["team_size"] = 0.90
                    highlights.append(f"Team headcount detected: {int(team_val)} members")
            except ValueError:
                pass

        # 6. CAC & LTV Unit Economics (e.g. "CAC: $450", "CAC is $600", "LTV is $3,200")
        cac_match = re.search(r'(?:cac|customer\s+acquisition\s+cost)(?:\s+is|\s+of|\s*[\:\=])?\s*\$?\s*([0-9\.\,]+)', lower_text)
        if cac_match:
            val = parse_currency_value(cac_match.group(1))
            if val and 10 <= val <= 20000:
                extracted["cac"] = val
                confidences["cac"] = 0.88
                highlights.append(f"CAC detected: ${val:,.0f}")

        ltv_match = re.search(r'(?:customer\s+ltv|ltv|lifetime\s+value)(?:\s+is|\s+of|\s*[\:\=])?\s*\$?\s*([0-9\.\,]+)', lower_text)
        if ltv_match:
            val = parse_currency_value(ltv_match.group(1))
            if val and 50 <= val <= 100000:
                extracted["ltv"] = val
                confidences["ltv"] = 0.88
                highlights.append(f"LTV detected: ${val:,.0f}")

        # 7. Churn Rate (e.g., "Churn: 2.5%", "Monthly churn 3%")
        churn_match = re.search(r'(?:monthly\s+churn|churn\s+rate|churn)[\s\:\=]*([0-9\.]+\s*%)', lower_text)
        if churn_match:
            val = parse_percentage_value(churn_match.group(1))
            if val and 0.001 <= val <= 0.30:
                extracted["churn_rate"] = val
                confidences["churn_rate"] = 0.89
                highlights.append(f"Churn rate detected: {val*100:.1f}%/mo")

        # 8. MoM Growth Rate (e.g., "15% MoM growth", "Growth: 20% month-over-month")
        growth_match = re.search(r'([0-9\.]+\s*%)\s*(?:mom|month\s+over\s+month|growth)', lower_text)
        if growth_match:
            val = parse_percentage_value(growth_match.group(1))
            if val and 0.01 <= val <= 2.0:
                extracted["growth_rate_mom"] = val
                confidences["growth_rate_mom"] = 0.84
                highlights.append(f"MoM Growth detected: {val*100:.1f}%")

        # 9. Market TAM (e.g., "$12B TAM", "TAM: $8.5 Billion", "Addressable Market $10B")
        tam_match = re.search(r'(?:tam|total\s+addressable\s+market)[\s\:\=]*\$?\s*([0-9\.\,]+\s*[kmb]?)', lower_text)
        if not tam_match:
            tam_match = re.search(r'\$\s*([0-9\.\,]+\s*[kmb]?)\s*(?:tam|market)', lower_text)
        if tam_match:
            val = parse_currency_value(tam_match.group(1))
            if val and val > 1_000_000:
                tam_billions = val / 1_000_000_000.0
                extracted["market_tam_billions"] = round(tam_billions, 2)
                confidences["market_tam_billions"] = 0.85
                highlights.append(f"TAM detected: ${tam_billions:.1f}B")

        # 10. Founder Experience (e.g., "10 years experience", "ex-Google founder with 7 yrs")
        exp_match = re.search(r'([0-9]+)\s*(?:years|yrs)\s*(?:of\s+)?(?:experience|domain|engineering)', lower_text)
        if exp_match:
            try:
                exp_val = float(exp_match.group(1))
                if 1 <= exp_val <= 30:
                    extracted["founder_experience_years"] = exp_val
                    confidences["founder_experience_years"] = 0.82
                    highlights.append(f"Founder experience detected: {int(exp_val)} years")
            except ValueError:
                pass

        return extracted, confidences, highlights

    @classmethod
    def assemble_44d_payload(cls, extracted_metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Merges extracted metrics onto the 44-dimensional canonical vector with coherent fallbacks.
        """
        payload = dict(DEFAULT_44D_METRICS)
        payload.update(extracted_metrics)

        # Synchronize dependent derived cash metrics
        if "monthly_burn_rate" in extracted_metrics and "runway_months" in extracted_metrics:
            payload["cash_balance"] = round(payload["monthly_burn_rate"] * payload["runway_months"], 2)

        return payload
