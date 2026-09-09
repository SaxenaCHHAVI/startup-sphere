# Startup Sphere 🌐🚀
### Prescriptive Predictive Analytics & Digital Twin Platform for Early-Stage Founders

**Startup Sphere** is an autonomous full-stack predictive intelligence platform designed for venture-backed and bootstrapped founders. It features a digital twin simulation sandbox, real-time XGBoost survival probability scoring, genuine SHAP TreeExplainer feature attributions, automated pitch deck OCR/NLP ingestion, and reactive state synchronization with Convex.

---

## Architecture Overview

```mermaid
graph TD
    User["Founder / Investor"] -->|Interacts with UI| NextClient["Next.js 16 App Router (Port 3000)<br/>- Digital Twin Sandbox<br/>- Recharts ChartSwitcher (Bar/Line/Area)<br/>- Pitch Deck Dropzone<br/>- Convex Reactive Sync"]
    
    NextClient -->|Async POST /simulate (120ms debounced)| FastAPIEngine["Python ML Microservice (Port 8000)<br/>- FastAPI + Uvicorn<br/>- Trained XGBoost-v3.4 Classifier<br/>- Real SHAP TreeExplainer (44-D)<br/>- PyPDF2 & Tesseract OCR Pipeline"]
    
    NextClient -->|POST /upload-pitch-deck| FastAPIEngine
    FastAPIEngine -->|Survival Probability + SHAP Vectors| NextClient
    
    NextClient <-->|Snapshot Persistence & Sync| ConvexLayer["Convex Reactive Data Layer<br/>- startups table<br/>- Real-time mutations & queries"]
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| **Data Visualization** | Recharts (dynamic Bar, Sensitivity Trajectory Line, Density Area) |
| **ML Microservice** | Python 3.11+, FastAPI, Uvicorn, XGBoost v3.4, SHAP v0.52, Scikit-learn, Pydantic |
| **Pitch Deck Pipeline** | PyPDF2 (native PDF parsing), Tesseract OCR, RegEx NLP Signal Extractor |
| **Reactive Data Layer** | Convex (strongly typed `startups` table schema, mutations & queries) |
| **Containerization** | Docker, multi-stage builds, Docker Compose orchestration |
| **Cloud Hosting Targets** | Vercel (Frontend), Render / Railway (FastAPI), Convex Cloud (Database) |

---

## 44-Dimensional Digital Twin Feature Vector

The ML engine evaluates founders across 44 synchronized financial, traction, team, and market dimensions:

1. `mrr` (Monthly Recurring Revenue)
2. `monthly_burn_rate` (Gross Burn)
3. `founder_experience_years` (Domain Experience)
4. `runway_months` (Cash Runway)
5. `team_size` (FTE Headcount)
6. `cac` (Customer Acquisition Cost)
7. `ltv` (Customer Lifetime Value)
8. `churn_rate` (Monthly Churn)
9. `net_promoter_score` (NPS)
10. `gross_margin` (Gross Margin %)
11. `growth_rate_mom` (Month-over-Month Growth)
12. `cash_balance` (Liquid Reserves)
13. `total_capital_raised` (Funding Raised)
14. `previous_exits` (Founder Exit Track Record)
15. `technical_founders_count`
16. `patent_count`
17. `market_tam_billions` (Total Addressable Market)
18. `market_growth_cagr`
19. `competitor_density`
20. `product_market_fit_score` (PMF Survey Index)
21. `sales_cycle_days`
22. `payback_period_months`
23. `revenue_concentration_top3`
24. `lead_conversion_rate`
25. `organic_traffic_ratio`
26. `active_users_dau_mau_ratio`
27. `headcount_engineering_ratio`
28. `headcount_sales_ratio`
29. `advisory_board_strength`
30. `investor_tier_score`
31. `regulatory_risk_score`
32. `macroeconomic_sensitivity`
33. `pricing_power_index`
34. `net_revenue_retention` (NRR)
35. `virality_coefficient_k_factor`
36. `domain_expertise_alignment`
37. `hiring_velocity_time_to_fill_days`
38. `esop_pool_percentage`
39. `debt_to_equity_ratio`
40. `ip_defensibility_score`
41. `b2b_enterprise_contract_ratio`
42. `founder_equity_retention`
43. `customer_concentration_risk`
44. `operational_efficiency_ratio`

---

## End-to-End Deployment Guide

### 1. Push to GitHub (`SaxenaCHHAVI`)

Initialize Git and push to your GitHub repository:

```powershell
cd c:\startup_sphere

# 1. Initialize git
git init
git add .
git commit -m "feat: complete Startup Sphere full-stack architecture (Phases 1-4)"

# 2. Add remote repository
git remote add origin https://github.com/SaxenaCHHAVI/startup-sphere.git
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

---

### 2. Deploy FastAPI Microservice (Render or Railway)

#### Deploying on Render:
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect `https://github.com/SaxenaCHHAVI/startup-sphere`.
4. Render will detect `ml_engine/render.yaml` and build the container using `ml_engine/Dockerfile`.
5. Once deployed, copy your backend URL (e.g., `https://startup-sphere-api.onrender.com`).

#### Deploying on Railway:
1. Navigate to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo** -> select `SaxenaCHHAVI/startup-sphere`.
3. Set the Root Directory to `ml_engine`.
4. Railway will build from `ml_engine/Dockerfile` and provide your public URL.

---

### 3. Deploy Frontend on Vercel

1. Navigate to [vercel.com](https://vercel.com/new).
2. Import the `SaxenaCHHAVI/startup-sphere` repository.
3. In **Project Settings**:
   - **Root Directory**: `client`
   - **Framework Preset**: Next.js
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render/Railway backend URL (e.g. `https://startup-sphere-api.onrender.com`).
   - `NEXT_PUBLIC_CONVEX_URL`: Your production Convex URL.
5. Click **Deploy**. Vercel will deploy your Next.js app to its global Edge network.

---

### 4. Deploy Convex Database to Production

1. Open your terminal in the `client` directory:
   ```powershell
   cd c:\startup_sphere\client
   npx convex deploy
   ```
2. Log in with your Convex credentials in the browser prompt.
3. Convex will publish `convex/schema.ts` and `convex/startups.ts` to your production Convex deployment.
4. Copy the production `CONVEX_URL` and add it to your Vercel project settings.

---

### 5. Local Docker Compose (All Services)

To run the entire full-stack application locally in Docker:

```powershell
cd c:\startup_sphere
docker compose up --build
```
- Frontend: `http://localhost:3000`
- ML Engine: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## Local Development (Without Docker)

### Terminal 1: Python ML Microservice
```powershell
cd c:\startup_sphere\ml_engine
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Next.js Frontend
```powershell
cd c:\startup_sphere\client
npm run dev -- -p 3000
```

---

## API Endpoints

### `POST /simulate`
Accepts a 44-dimensional feature payload and returns calibrated survival probability, 95% confidence intervals, risk tier, and SHAP TreeExplainer attributions.

### `POST /upload-pitch-deck`
Accepts multipart form-data `.pdf` or slide image uploads, runs the PyPDF2/OCR NLP pipeline, extracts metrics, and computes simulation projections.

### `GET /health`
Readiness probe returning service status and model metadata.

---

## License & Authors
Created for early-stage founders by the **Startup Sphere** engineering team.
GitHub: [@SaxenaCHHAVI](https://github.com/SaxenaCHHAVI)
