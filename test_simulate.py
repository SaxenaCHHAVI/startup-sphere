import urllib.request
import json

payload = {
    "mrr": 20000.0,
    "monthly_burn_rate": 30000.0,
    "founder_experience_years": 5.0,
    "runway_months": 16.0,
    "team_size": 7,
    "cac": 400.0,
    "ltv": 2000.0,
    "churn_rate": 0.03
}

req = urllib.request.Request(
    "http://127.0.0.1:8000/simulate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode("utf-8"))
        print("\n=== STARTUP SPHERE SIMULATION RESULT ===")
        print(f"Survival Probability: {result['survival_probability'] * 100:.1f}%")
        print(f"Risk Category:        {result['risk_tier']}")
        print(f"95% Confidence Band:  {result['confidence_interval'][0]*100:.1f}% - {result['confidence_interval'][1]*100:.1f}%")
        print("\nTop 5 SHAP Feature Drivers:")
        for driver in result["shap_top_drivers"][:5]:
            sign = "+" if driver["attribution"] >= 0 else ""
            print(f"  • {driver['feature']:<25}: {sign}{driver['attribution']*100:.2f}% ({driver['direction']})")
        print("\nPrescriptive Recommendations:")
        for rec in result["prescriptive_recommendations"]:
            print(f"  {rec}")
        print("=========================================\n")
except Exception as e:
    print("Error calling /simulate endpoint:", e)
