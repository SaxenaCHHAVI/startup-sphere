import sys
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

import json
import urllib.request
import mimetypes

# Let's test the FastAPI /simulate and /upload-pitch-deck with multipart payload
# First test FastAPI /health
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as res:
        data = json.loads(res.read().decode("utf-8"))
        print("FastAPI Health Check:", data)
except Exception as e:
    print("FastAPI not currently running on 8000:", e)

# Test pitch deck parser directly
from ml_engine.deck_parser import PitchDeckParser
from ml_engine.model_pipeline import run_xgboost_shap_simulation

sample_deck = """
Horizon Robotics - Seed Pitch Deck
Financial Traction:
- Current MRR: $42,000 / mo ($504k ARR)
- Monthly Burn: $55,000
- Cash in bank: $900,000 with 17 months runway
- Unit Economics: CAC is $600, Customer LTV is $3,200
- Monthly Churn: 2.2%
- MoM Growth: 16% revenue growth
- Team: 8 full-time engineers with 5 years founder domain experience
- Market: Total addressable market (TAM) of $22B
"""

extracted, confidences, highlights = PitchDeckParser.extract_metrics_nlp(sample_deck)
assembled = PitchDeckParser.assemble_44d_payload(extracted)
sim = run_xgboost_shap_simulation(assembled)

print("\n=== PITCH DECK EXTRACTION VERIFICATION ===")
print(f"Extracted MRR:       ${extracted.get('mrr', 0):,.0f} (Confidence: {confidences.get('mrr', 0)*100:.0f}%)")
print(f"Extracted Burn Rate: ${extracted.get('monthly_burn_rate', 0):,.0f} (Confidence: {confidences.get('monthly_burn_rate', 0)*100:.0f}%)")
print(f"Extracted Runway:    {extracted.get('runway_months', 0):.0f} months (Confidence: {confidences.get('runway_months', 0)*100:.0f}%)")
print(f"Extracted Team Size: {extracted.get('team_size', 0):.0f} members")
print(f"Extracted LTV:       ${extracted.get('ltv', 0):,.0f}")
print(f"Extracted CAC:       ${extracted.get('cac', 0):,.0f}")
print(f"\nTrained XGBoost Survival Odds: {sim['survival_probability']*100:.1f}%")
print(f"Risk Tier:                     {sim['risk_tier']}")
print("\nTop 5 SHAP TreeExplainer Attributions:")
for d in sim["shap_top_drivers"][:5]:
    sign = "+" if d["attribution"] >= 0 else ""
    print(f"  {d['feature']:<25}: {sign}{d['attribution']*100:.2f}% ({d['direction']})")
print("\nPrescriptive Recommendations:")
for r in sim["prescriptive_recommendations"]:
    print(f"  {r}")
print("===========================================")
