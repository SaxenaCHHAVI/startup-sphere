from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

try:
    from deck_parser import PitchDeckParser, DEFAULT_44D_METRICS
    from model_pipeline import run_xgboost_shap_simulation
except ImportError:
    from ml_engine.deck_parser import PitchDeckParser, DEFAULT_44D_METRICS
    from ml_engine.model_pipeline import run_xgboost_shap_simulation

app = FastAPI(
    title="Startup Sphere - ML Engine",
    description="Prescriptive Predictive Analytics Microservice for Early-Stage Founders",
    version="2.0.0"
)

# Enable CORS for Next.js frontend (port 3000 and wildcard for dev flexibility)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationPayload(BaseModel):
    # Core Founder & Financial Features
    mrr: float = Field(default=15000.0, description="Monthly Recurring Revenue ($)")
    monthly_burn_rate: float = Field(default=25000.0, description="Gross Monthly Burn Rate ($)")
    founder_experience_years: float = Field(default=4.0, description="Founder Experience in Years")
    runway_months: float = Field(default=14.0, description="Calculated Runway in Months")
    team_size: int = Field(default=6, description="Full-time Team Headcount")
    cac: float = Field(default=450.0, description="Customer Acquisition Cost ($)")
    ltv: float = Field(default=1800.0, description="Customer Lifetime Value ($)")
    churn_rate: float = Field(default=0.035, description="Monthly Customer Churn Rate (0-1)")
    net_promoter_score: float = Field(default=52.0, description="NPS Score (-100 to 100)")
    gross_margin: float = Field(default=0.78, description="Gross Margin Percentage (0-1)")
    growth_rate_mom: float = Field(default=0.12, description="Month-over-Month Growth Rate (0-1)")
    cash_balance: float = Field(default=350000.0, description="Liquid Cash Reserves ($)")
    total_capital_raised: float = Field(default=500000.0, description="Total Capital Raised ($)")
    previous_exits: int = Field(default=0, description="Number of Previous Founder Exits")
    technical_founders_count: int = Field(default=1, description="Number of Technical Co-founders")
    patent_count: int = Field(default=0, description="Granted or Pending Patents")
    market_tam_billions: float = Field(default=8.5, description="Total Addressable Market in $B")
    market_growth_cagr: float = Field(default=0.18, description="Industry TAM CAGR (0-1)")
    competitor_density: float = Field(default=0.45, description="Competitive Density Index (0-1)")
    product_market_fit_score: float = Field(default=0.72, description="PMF Survey Score (0-1)")
    sales_cycle_days: float = Field(default=35.0, description="Average Sales Cycle in Days")
    payback_period_months: float = Field(default=7.5, description="CAC Payback Period in Months")
    revenue_concentration_top3: float = Field(default=0.22, description="Top 3 Client Rev Share (0-1)")
    lead_conversion_rate: float = Field(default=0.048, description="Funnel Conversion Rate (0-1)")
    organic_traffic_ratio: float = Field(default=0.58, description="Organic Traffic Share (0-1)")
    active_users_dau_mau_ratio: float = Field(default=0.42, description="DAU / MAU Stickiness Ratio")
    headcount_engineering_ratio: float = Field(default=0.50, description="Eng Headcount Share (0-1)")
    headcount_sales_ratio: float = Field(default=0.25, description="GTM Headcount Share (0-1)")
    advisory_board_strength: float = Field(default=0.65, description="Advisory Board Index (0-1)")
    investor_tier_score: float = Field(default=0.75, description="Lead Investor Tier Index (0-1)")
    regulatory_risk_score: float = Field(default=0.20, description="Regulatory Exposure Index (0-1)")
    macroeconomic_sensitivity: float = Field(default=0.30, description="Macro Sensitivity Index (0-1)")
    pricing_power_index: float = Field(default=0.68, description="Pricing Elasticity Index (0-1)")
    net_revenue_retention: float = Field(default=1.15, description="Net Revenue Retention Rate (e.g. 1.15 = 115%)")
    virality_coefficient_k_factor: float = Field(default=0.35, description="Viral K-Factor (0-2)")
    domain_expertise_alignment: float = Field(default=0.85, description="Founder Domain Match (0-1)")
    hiring_velocity_time_to_fill_days: float = Field(default=42.0, description="Avg Days to Fill Roles")
    esop_pool_percentage: float = Field(default=0.12, description="Employee Stock Pool (0-1)")
    debt_to_equity_ratio: float = Field(default=0.05, description="Venture Debt / Equity Ratio")
    ip_defensibility_score: float = Field(default=0.60, description="Moat Defensibility Score (0-1)")
    b2b_enterprise_contract_ratio: float = Field(default=0.40, description="Enterprise ACV Share (0-1)")
    founder_equity_retention: float = Field(default=0.75, description="Founding Team Equity Share")
    customer_concentration_risk: float = Field(default=0.18, description="Single Customer Max Exposure")
    operational_efficiency_ratio: float = Field(default=0.74, description="Magic Number / Efficiency (0-1)")

class SimulationResponse(BaseModel):
    survival_probability: float
    confidence_interval: List[float]
    risk_tier: str
    shap_attributions: Dict[str, float]
    shap_top_drivers: List[Dict[str, Any]]
    prescriptive_recommendations: List[str]
    twin_metrics_summary: Dict[str, Any]

class PitchDeckUploadResponse(BaseModel):
    filename: str
    file_type: str
    page_count: int
    raw_text_snippet: str
    extracted_metrics: Dict[str, float]
    confidence_scores: Dict[str, float]
    extraction_highlights: List[str]
    simulation_projection: SimulationResponse

@app.get("/")
def root():
    return {
        "service": "Startup Sphere ML Engine",
        "status": "online",
        "version": "2.0.0",
        "model": "Trained XGBoost-v3.4 + SHAP TreeExplainer",
        "endpoints": ["/simulate", "/upload-pitch-deck", "/health"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml_engine",
        "port": 8000,
        "model_loaded": True,
        "explainer": "SHAP TreeExplainer"
    }

@app.post("/simulate", response_model=SimulationResponse)
def simulate_digital_twin(payload: SimulationPayload):
    """
    Simulates survival probability and extracts exact SHAP TreeExplainer attributions
    from the trained XGBoost model across all 44 feature dimensions.
    """
    try:
        result = run_xgboost_shap_simulation(payload.model_dump())
        return SimulationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XGBoost/SHAP simulation error: {str(e)}")

@app.post("/upload-pitch-deck", response_model=PitchDeckUploadResponse)
async def upload_pitch_deck(file: UploadFile = File(...)):
    """
    Ingests a pitch deck PDF or slide image, executes the PyPDF2/OCR extraction pipeline,
    extracts key financial & operational metrics via NLP pattern matching,
    and runs the calibrated XGBoost + SHAP simulation automatically.
    """
    try:
        file_bytes = await file.read()
        filename = file.filename or "deck.pdf"
        is_pdf = filename.lower().endswith(".pdf")
        
        extracted_text = ""
        page_count = 1

        if is_pdf:
            extracted_text, page_count = PitchDeckParser.extract_text_from_pdf(file_bytes)
            # If native PDF text is sparse, attempt OCR on pages
            if len(extracted_text.strip()) < 50:
                ocr_text = PitchDeckParser.extract_text_via_ocr(file_bytes)
                if ocr_text:
                    extracted_text += f"\n[OCR Text]\n{ocr_text}"
        else:
            # Assume image pitch deck slide
            extracted_text = PitchDeckParser.extract_text_via_ocr(file_bytes)

        # NLP extraction
        extracted_metrics, confidences, highlights = PitchDeckParser.extract_metrics_nlp(extracted_text)

        # Assemble full 44D vector
        assembled_44d = PitchDeckParser.assemble_44d_payload(extracted_metrics)

        # Run real XGBoost + SHAP TreeExplainer inference
        sim_result = run_xgboost_shap_simulation(assembled_44d)

        return PitchDeckUploadResponse(
            filename=filename,
            file_type="PDF Document" if is_pdf else "Slide Image",
            page_count=page_count,
            raw_text_snippet=extracted_text[:400] + ("..." if len(extracted_text) > 400 else ""),
            extracted_metrics=extracted_metrics,
            confidence_scores=confidences,
            extraction_highlights=highlights,
            simulation_projection=SimulationResponse(**sim_result)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch deck processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
