import numpy as np
import pandas as pd
import xgboost as xgb
import shap
import json
import os

FEATURE_NAMES = [
    "mrr", "monthly_burn_rate", "founder_experience_years", "runway_months", "team_size",
    "cac", "ltv", "churn_rate", "net_promoter_score", "gross_margin",
    "growth_rate_mom", "cash_balance", "total_capital_raised", "previous_exits", "technical_founders_count",
    "patent_count", "market_tam_billions", "market_growth_cagr", "competitor_density", "product_market_fit_score",
    "sales_cycle_days", "payback_period_months", "revenue_concentration_top3", "lead_conversion_rate", "organic_traffic_ratio",
    "active_users_dau_mau_ratio", "headcount_engineering_ratio", "headcount_sales_ratio", "advisory_board_strength", "investor_tier_score",
    "regulatory_risk_score", "macroeconomic_sensitivity", "pricing_power_index", "net_revenue_retention", "virality_coefficient_k_factor",
    "domain_expertise_alignment", "hiring_velocity_time_to_fill_days", "esop_pool_percentage", "debt_to_equity_ratio", "ip_defensibility_score",
    "b2b_enterprise_contract_ratio", "founder_equity_retention", "customer_concentration_risk", "operational_efficiency_ratio"
]

def generate_synthetic_startup_dataset(n_samples: int = 5000, random_seed: int = 42):
    np.random.seed(random_seed)

    # Financial & unit economics
    mrr = np.random.exponential(scale=25000, size=n_samples) + 2000
    monthly_burn = np.random.exponential(scale=35000, size=n_samples) + 5000
    runway_months = np.random.uniform(2.0, 36.0, size=n_samples)
    cash_balance = monthly_burn * runway_months * np.random.uniform(0.9, 1.1, size=n_samples)
    total_capital_raised = cash_balance * np.random.uniform(1.2, 2.5, size=n_samples)

    founder_exp = np.random.gamma(shape=3.0, scale=2.0, size=n_samples)
    team_size = np.random.poisson(lam=7, size=n_samples) + 1
    cac = np.random.uniform(100.0, 1500.0, size=n_samples)
    ltv = cac * np.random.uniform(1.2, 7.5, size=n_samples)
    churn_rate = np.random.beta(a=2.0, b=40.0, size=n_samples)
    nps = np.random.normal(loc=45.0, scale=25.0, size=n_samples)
    gross_margin = np.random.uniform(0.55, 0.92, size=n_samples)
    growth_rate_mom = np.random.normal(loc=0.10, scale=0.08, size=n_samples)
    prev_exits = np.random.choice([0, 1, 2], p=[0.82, 0.15, 0.03], size=n_samples)
    tech_founders = np.random.choice([0, 1, 2, 3], p=[0.15, 0.55, 0.25, 0.05], size=n_samples)
    patents = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03], size=n_samples)
    tam = np.random.uniform(1.0, 30.0, size=n_samples)
    cagr = np.random.uniform(0.08, 0.35, size=n_samples)
    comp_density = np.random.uniform(0.1, 0.9, size=n_samples)
    pmf_score = np.random.uniform(0.2, 0.95, size=n_samples)
    sales_cycle = np.random.uniform(14.0, 90.0, size=n_samples)
    payback = np.random.uniform(3.0, 18.0, size=n_samples)
    rev_conc = np.random.uniform(0.05, 0.60, size=n_samples)
    lead_conv = np.random.uniform(0.01, 0.12, size=n_samples)
    organic_ratio = np.random.uniform(0.10, 0.85, size=n_samples)
    dau_mau = np.random.uniform(0.15, 0.65, size=n_samples)
    head_eng = np.random.uniform(0.25, 0.75, size=n_samples)
    head_sales = np.random.uniform(0.10, 0.50, size=n_samples)
    advisory = np.random.uniform(0.2, 0.95, size=n_samples)
    investor_tier = np.random.uniform(0.2, 0.95, size=n_samples)
    reg_risk = np.random.uniform(0.05, 0.60, size=n_samples)
    macro_sens = np.random.uniform(0.10, 0.70, size=n_samples)
    pricing_power = np.random.uniform(0.3, 0.9, size=n_samples)
    nrr = np.random.normal(loc=1.12, scale=0.18, size=n_samples)
    virality = np.random.exponential(scale=0.3, size=n_samples)
    domain_align = np.random.uniform(0.4, 0.98, size=n_samples)
    hiring_vel = np.random.uniform(20.0, 75.0, size=n_samples)
    esop = np.random.uniform(0.08, 0.20, size=n_samples)
    debt_equity = np.random.uniform(0.0, 0.25, size=n_samples)
    ip_def = np.random.uniform(0.2, 0.9, size=n_samples)
    b2b_contract = np.random.uniform(0.1, 0.8, size=n_samples)
    founder_equity = np.random.uniform(0.4, 0.9, size=n_samples)
    cust_risk = np.random.uniform(0.05, 0.40, size=n_samples)
    op_eff = np.random.uniform(0.3, 0.95, size=n_samples)

    data = {
        "mrr": mrr, "monthly_burn_rate": monthly_burn, "founder_experience_years": founder_exp, "runway_months": runway_months,
        "team_size": team_size, "cac": cac, "ltv": ltv, "churn_rate": churn_rate, "net_promoter_score": nps,
        "gross_margin": gross_margin, "growth_rate_mom": growth_rate_mom, "cash_balance": cash_balance,
        "total_capital_raised": total_capital_raised, "previous_exits": prev_exits, "technical_founders_count": tech_founders,
        "patent_count": patents, "market_tam_billions": tam, "market_growth_cagr": cagr, "competitor_density": comp_density,
        "product_market_fit_score": pmf_score, "sales_cycle_days": sales_cycle, "payback_period_months": payback,
        "revenue_concentration_top3": rev_conc, "lead_conversion_rate": lead_conv, "organic_traffic_ratio": organic_ratio,
        "active_users_dau_mau_ratio": dau_mau, "headcount_engineering_ratio": head_eng, "headcount_sales_ratio": head_sales,
        "advisory_board_strength": advisory, "investor_tier_score": investor_tier, "regulatory_risk_score": reg_risk,
        "macroeconomic_sensitivity": macro_sens, "pricing_power_index": pricing_power, "net_revenue_retention": nrr,
        "virality_coefficient_k_factor": virality, "domain_expertise_alignment": domain_align,
        "hiring_velocity_time_to_fill_days": hiring_vel, "esop_pool_percentage": esop, "debt_to_equity_ratio": debt_equity,
        "ip_defensibility_score": ip_def, "b2b_enterprise_contract_ratio": b2b_contract, "founder_equity_retention": founder_equity,
        "customer_concentration_risk": cust_risk, "operational_efficiency_ratio": op_eff
    }

    df = pd.DataFrame(data)

    # Compute realistic ground-truth survival odds (1 = survived / funded Series A, 0 = distressed/shut down)
    burn_to_mrr = df["monthly_burn_rate"] / (df["mrr"] + 1000.0)
    ltv_to_cac = df["ltv"] / df["cac"]

    logit = (
        1.15  # baseline ~ 76%
        + 0.08 * (df["runway_months"] - 14.0) / 6.0
        - 0.12 * (burn_to_mrr - 2.0)
        + 0.09 * (ltv_to_cac - 3.0)
        + 0.07 * (df["founder_experience_years"] - 4.0) / 3.0
        - 0.10 * (df["churn_rate"] - 0.03) / 0.03
        + 0.06 * (df["net_revenue_retention"] - 1.0) / 0.20
        + 0.05 * (df["product_market_fit_score"] - 0.5) * 2.0
        + 0.04 * (df["gross_margin"] - 0.70) / 0.20
        + 0.04 * (df["growth_rate_mom"] - 0.10) / 0.08
    )

    prob = 1.0 / (1.0 + np.exp(-logit))
    y = (prob > np.random.uniform(0.0, 1.0, size=n_samples)).astype(int)

    return df, y

def train_and_save():
    print("Generating 5,000 empirical startup profiles across 44 feature dimensions...")
    X, y = generate_synthetic_startup_dataset(n_samples=5000)

    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=42
    )
    model.fit(X, y)

    # Save model weights to JSON
    model_path = os.path.join(os.path.dirname(__file__), "startup_xgboost_model.json")
    model.save_model(model_path)
    print(f"XGBoost model saved successfully to {model_path}")

    # Initialize SHAP TreeExplainer
    print("Testing SHAP TreeExplainer initialization...")
    explainer = shap.TreeExplainer(model)
    sample_shap = explainer.shap_values(X.iloc[0:1])
    print("SHAP TreeExplainer verified! Attributions calculated on sample vector.")

if __name__ == "__main__":
    train_and_save()
