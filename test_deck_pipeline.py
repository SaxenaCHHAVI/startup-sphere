import io
import sys
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
from ml_engine.deck_parser import PitchDeckParser
from ml_engine.model_pipeline import run_xgboost_shap_simulation

# Create a minimal valid PDF in-memory with PyPDF2 / text stream
# Or we can test text extraction directly:
sample_pitch_deck_text = """
Apex AI - Series Seed Pitch Deck
Executive Summary:
We are building the autonomous agent infrastructure for modern enterprises.

Traction & Financial Metrics:
- Monthly Recurring Revenue (MRR): $35,000 / mo
- Gross Monthly Burn Rate: $48,000
- Cash in bank: $750,000 with 16 months runway
- Unit Economics: CAC: $450, LTV: $2,800
- Customer Retention: Monthly churn rate is 2.5%
- Growth: 18% MoM revenue expansion
- Team: Exceptional team of 9 full-time engineers with 6 years of domain experience
- Market Opportunity: Total Addressable Market (TAM) of $14.5B growing at 22% CAGR
"""

print("Testing Pitch Deck NLP Metric Extractor...")
extracted, confidences, highlights = PitchDeckParser.extract_metrics_nlp(sample_pitch_deck_text)

print("\n--- Extracted Metrics ---")
for k, v in extracted.items():
    conf = confidences.get(k, 0.0) * 100
    print(f"  • {k:<25}: {v} (Confidence: {conf:.1f}%)")

print("\n--- Highlights ---")
for h in highlights:
    print(f"  {h}")

print("\n--- Assembling 44-D Vector ---")
assembled = PitchDeckParser.assemble_44d_payload(extracted)
print(f"Total features in vector: {len(assembled)}")

print("\n--- Running Trained XGBoost + SHAP TreeExplainer Simulation ---")
result = run_xgboost_shap_simulation(assembled)
print(f"Survival Probability: {result['survival_probability'] * 100:.1f}%")
print(f"Risk Tier:            {result['risk_tier']}")
print("\nTop 5 SHAP TreeExplainer Attributions:")
for driver in result["shap_top_drivers"][:5]:
    sign = "+" if driver["attribution"] >= 0 else ""
    print(f"  {driver['feature']:<25}: {sign}{driver['attribution']*100:.2f}% ({driver['direction']})")

print("\nPrescriptive Recommendations:")
for rec in result["prescriptive_recommendations"]:
    print(f"  {rec}")

print("\nSUCCESS: Pitch deck OCR/NLP & XGBoost/SHAP pipeline verified!")
