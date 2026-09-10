"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Sliders,
  DollarSign,
  Clock,
  Users,
  Award,
  RefreshCw,
  Server,
  Database,
  ChevronRight,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  UploadCloud,
  FileCheck,
  Bookmark,
  History,
  Trash2,
  CornerDownRight,
  Check,
} from "lucide-react";
import ChartSwitcher, { ShapDriver } from "@/components/ChartSwitcher";
import ConvexClientProvider, { useConvexSync, SimulationSnapshot } from "@/components/ConvexClientProvider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const initialMetrics = {
  mrr: 18000,
  monthly_burn_rate: 28000,
  runway_months: 14,
  founder_experience_years: 4,
  team_size: 6,
  cac: 450,
  ltv: 1850,
  churn_rate: 0.035,
  net_revenue_retention: 1.15,
  gross_margin: 0.78,
};

const presets = [
  {
    name: "Scrappy Pre-Seed",
    metrics: {
      mrr: 6000,
      monthly_burn_rate: 12000,
      runway_months: 18,
      founder_experience_years: 3,
      team_size: 3,
      cac: 250,
      ltv: 1200,
      churn_rate: 0.025,
      net_revenue_retention: 1.10,
      gross_margin: 0.82,
    },
  },
  {
    name: "Seed Hypergrowth",
    metrics: {
      mrr: 38000,
      monthly_burn_rate: 45000,
      runway_months: 15,
      founder_experience_years: 5,
      team_size: 8,
      cac: 550,
      ltv: 2400,
      churn_rate: 0.03,
      net_revenue_retention: 1.25,
      gross_margin: 0.79,
    },
  },
  {
    name: "Series A Milestone",
    metrics: {
      mrr: 95000,
      monthly_burn_rate: 85000,
      runway_months: 20,
      founder_experience_years: 7,
      team_size: 16,
      cac: 750,
      ltv: 3800,
      churn_rate: 0.018,
      net_revenue_retention: 1.35,
      gross_margin: 0.84,
    },
  },
  {
    name: "Downside / Crisis Burn",
    metrics: {
      mrr: 9000,
      monthly_burn_rate: 68000,
      runway_months: 5,
      founder_experience_years: 2,
      team_size: 11,
      cac: 900,
      ltv: 1100,
      churn_rate: 0.075,
      net_revenue_retention: 0.90,
      gross_margin: 0.65,
    },
  },
];

function DashboardContent() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  // Tab State (Sandbox vs Pitch Deck Ingestion)
  const [leftTab, setLeftTab] = useState<"sandbox" | "upload">("sandbox");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedDeckInfo, setUploadedDeckInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation response state & delta tracking
  const [survivalProbability, setSurvivalProbability] = useState<number>(0.76);
  const [previousProbability, setPreviousProbability] = useState<number>(0.76);
  const [confidenceInterval, setConfidenceInterval] = useState<[number, number]>([0.71, 0.81]);
  const [riskTier, setRiskTier] = useState<string>("Tier 2: Balanced / Seed Viability");
  const [shapDrivers, setShapDrivers] = useState<ShapDriver[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [twinSummary, setTwinSummary] = useState<any>({
    effective_runway: 14.0,
    ltv_cac_ratio: 4.11,
    net_burn: 10000,
    dimensions_evaluated: 44,
  });

  // Snapshot naming state
  const [snapshotName, setSnapshotName] = useState<string>("");
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Convex Reactive State
  const { isConfigured: isConvexConfigured, snapshots, activeSnapshotId, saveSnapshot, deleteSnapshot, loadSnapshot } = useConvexSync();

  // Debounced API execution ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Call the FastAPI /simulate endpoint (Trained XGBoost + SHAP TreeExplainer)
  const runSimulation = useCallback(async (currentMetrics: typeof initialMetrics, immediate = false) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const executeCall = async () => {
      setIsLoading(true);
      try {
        const payload = {
          ...currentMetrics,
          cash_balance: currentMetrics.monthly_burn_rate * currentMetrics.runway_months,
          total_capital_raised: 400000,
          previous_exits: currentMetrics.founder_experience_years > 5 ? 1 : 0,
          technical_founders_count: 1,
          market_tam_billions: 9.2,
          competitor_density: 0.42,
          product_market_fit_score: currentMetrics.mrr > 25000 ? 0.82 : 0.68,
          advisory_board_strength: 0.7,
          investor_tier_score: 0.75,
        };

        const response = await fetch(`${API_BASE_URL}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setPreviousProbability((prev) => survivalProbability);
        setSurvivalProbability(data.survival_probability);
        setConfidenceInterval(data.confidence_interval || [0.7, 0.8]);
        setRiskTier(data.risk_tier);
        setShapDrivers(data.shap_top_drivers || []);
        setRecommendations(data.prescriptive_recommendations || []);
        setTwinSummary(data.twin_metrics_summary || {});
        setApiConnected(true);
        setLastSyncedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn("Simulation API connection notice:", err);
        setApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (immediate) {
      await executeCall();
    } else {
      debounceTimer.current = setTimeout(executeCall, 120);
    }
  }, [survivalProbability]);

  useEffect(() => {
    runSimulation(metrics, true);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleMetricChange = (key: keyof typeof initialMetrics, value: number) => {
    setActivePreset(null);
    const nextMetrics = { ...metrics, [key]: value };
    setMetrics(nextMetrics);
    runSimulation(nextMetrics, false);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setActivePreset(preset.name);
    setMetrics(preset.metrics);
    runSimulation(preset.metrics, true);
  };

  const resetDefaults = () => {
    setActivePreset(null);
    setMetrics(initialMetrics);
    setUploadedDeckInfo(null);
    runSimulation(initialMetrics, true);
  };

  // Handle Pitch Deck File Upload & OCR/NLP Pipeline
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload-pitch-deck`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadedDeckInfo(data);

      const extracted = data.extracted_metrics || {};
      const updatedMetrics = { ...metrics };
      if (extracted.mrr) updatedMetrics.mrr = Math.round(extracted.mrr);
      if (extracted.monthly_burn_rate) updatedMetrics.monthly_burn_rate = Math.round(extracted.monthly_burn_rate);
      if (extracted.runway_months) updatedMetrics.runway_months = Math.round(extracted.runway_months);
      if (extracted.team_size) updatedMetrics.team_size = Math.round(extracted.team_size);
      if (extracted.founder_experience_years) updatedMetrics.founder_experience_years = Math.round(extracted.founder_experience_years);
      if (extracted.cac) updatedMetrics.cac = Math.round(extracted.cac);
      if (extracted.ltv) updatedMetrics.ltv = Math.round(extracted.ltv);
      if (extracted.churn_rate !== undefined) updatedMetrics.churn_rate = extracted.churn_rate;

      setMetrics(updatedMetrics);

      if (data.simulation_projection) {
        const proj = data.simulation_projection;
        setPreviousProbability(survivalProbability);
        setSurvivalProbability(proj.survival_probability);
        setConfidenceInterval(proj.confidence_interval || [0.7, 0.8]);
        setRiskTier(proj.risk_tier);
        setShapDrivers(proj.shap_top_drivers || []);
        setRecommendations(proj.prescriptive_recommendations || []);
        setTwinSummary(proj.twin_metrics_summary || {});
      }
      setApiConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Pitch deck upload error:", err);
      alert("Failed to parse pitch deck. Please check that FastAPI is running on port 8000.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save current simulation into Convex / reactive store
  const handleSaveCurrentSnapshot = () => {
    const defaultTitle = activePreset || (uploadedDeckInfo ? `Deck: ${uploadedDeckInfo.filename}` : `Snapshot ${snapshots.length + 1}`);
    const nameToSave = snapshotName.trim() || defaultTitle;

    saveSnapshot(nameToSave, {
      metrics: { ...metrics },
      digitalTwinProjections: {
        survivalProbability,
        riskTier,
        confidenceInterval,
        prescriptiveRecommendations: recommendations,
        simulatedAt: new Date().toISOString(),
      },
    });

    setSnapshotName("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  // Restore snapshot into active digital twin
  const handleRestoreSnapshot = (snap: SimulationSnapshot) => {
    loadSnapshot(snap.id);
    const restoredMetrics = {
      ...initialMetrics,
      ...snap.metrics,
      net_revenue_retention: snap.metrics.net_revenue_retention ?? 1.15,
      gross_margin: snap.metrics.gross_margin ?? 0.78,
    };
    setMetrics(restoredMetrics);
    setActivePreset(snap.name);
    setPreviousProbability(survivalProbability);
    setSurvivalProbability(snap.digitalTwinProjections.survivalProbability);
    setConfidenceInterval(snap.digitalTwinProjections.confidenceInterval);
    setRiskTier(snap.digitalTwinProjections.riskTier);
    setRecommendations(snap.digitalTwinProjections.prescriptiveRecommendations);
    runSimulation(restoredMetrics, true);
  };

  const getProbabilityTheme = (prob: number) => {
    if (prob >= 0.75) return { text: "text-purple-300", bg: "bg-violet-500", ring: "ring-violet-500/40", border: "border-violet-500/40" };
    if (prob >= 0.55) return { text: "text-blue-400", bg: "bg-blue-600", ring: "ring-blue-500/40", border: "border-blue-500/40" };
    return { text: "text-rose-400", bg: "bg-rose-600", ring: "ring-rose-500/40", border: "border-rose-500/40" };
  };

  const theme = getProbabilityTheme(survivalProbability);
  const deltaOdds = Math.round((survivalProbability - previousProbability) * 1000) / 10;

  // Solver gap to 85% Tier 1 target
  const gapToTier1 = Math.max(0, 0.85 - survivalProbability);
  const suggestedBurnReduction = Math.round(metrics.monthly_burn_rate * (gapToTier1 * 0.4));
  const suggestedRunwayExtension = Math.ceil(gapToTier1 * 12);

  return (
    <div className="flex min-h-screen flex-col bg-black text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-violet-500 to-purple-300 shadow-lg shadow-violet-600/30">
              <Zap className="h-5 w-5 text-white" />
              <div className="absolute -inset-0.5 rounded-xl bg-violet-500 opacity-30 blur-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">Startup Sphere</span>
                <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-violet-500/40">
                  CONVEX REACTIVE SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Prescriptive Predictive Analytics Platform</p>
            </div>
          </div>

          {/* Connection Status Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-[#0c0c17] px-3 py-1 text-slate-300">
              <Server className="h-3.5 w-3.5 text-violet-400" />
              <span>FastAPI (Port 8000):</span>
              {apiConnected === null ? (
                <span className="text-slate-400">Connecting...</span>
              ) : apiConnected ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live (120ms Debounce)
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Offline
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-[#0c0c17] px-3 py-1 text-slate-300">
              <Database className="h-3.5 w-3.5 text-purple-300" />
              <span>Convex Reactive:</span>
              <span className="font-semibold text-purple-300 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse"></span>
                Active ({snapshots.length} Snapshots)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Scenario Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#0c0c17]/90 p-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <span>Preset Simulation Archetypes:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activePreset === p.name
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 font-semibold"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Reset sliders"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Sandbox Sliders OR Pitch Deck Ingestion (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-violet-500/20 shadow-2xl">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLeftTab("sandbox")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      leftTab === "sandbox"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-slate-200 bg-slate-900/60"
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    What-if Sandbox
                  </button>
                  <button
                    onClick={() => setLeftTab("upload")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      leftTab === "upload"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-slate-200 bg-slate-900/60"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Ingest Pitch Deck
                  </button>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-300">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Inference...</span>
                  </div>
                )}
              </div>

              {/* Tab 1: Sandbox Sliders */}
              {leftTab === "sandbox" ? (
                <div className="mt-6 space-y-5">
                  {/* 1. Monthly Burn Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-rose-400" />
                        Monthly Burn Rate
                      </label>
                      <span className="font-mono font-bold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                        ${metrics.monthly_burn_rate.toLocaleString()} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={120000}
                      step={1000}
                      value={metrics.monthly_burn_rate}
                      onChange={(e) => handleMetricChange("monthly_burn_rate", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>$2k</span>
                      <span>$50k</span>
                      <span>$120k</span>
                    </div>
                  </div>

                  {/* 2. Monthly Recurring Revenue (MRR) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        Monthly Recurring Revenue (MRR)
                      </label>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        ${metrics.mrr.toLocaleString()} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100000}
                      step={1000}
                      value={metrics.mrr}
                      onChange={(e) => handleMetricChange("mrr", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>$0</span>
                      <span>$40k</span>
                      <span>$100k+</span>
                    </div>
                  </div>

                  {/* 3. Runway in Months */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-purple-300" />
                        Cash Runway
                      </label>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          metrics.runway_months < 6
                            ? "text-rose-300 bg-rose-950/40 border-rose-800/40"
                            : "text-purple-300 bg-violet-950/40 border-violet-800/40"
                        }`}
                      >
                        {metrics.runway_months} Months
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={36}
                      step={1}
                      value={metrics.runway_months}
                      onChange={(e) => handleMetricChange("runway_months", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>

                  {/* 4. Founder Experience */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-blue-400" />
                        Founder Experience
                      </label>
                      <span className="font-mono font-bold text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
                        {metrics.founder_experience_years} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={metrics.founder_experience_years}
                      onChange={(e) => handleMetricChange("founder_experience_years", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>

                  {/* 5. Team Headcount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-300" />
                        Team Headcount
                      </label>
                      <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {metrics.team_size} Members
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={metrics.team_size}
                      onChange={(e) => handleMetricChange("team_size", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>

                  {/* 6. CAC & LTV */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">CAC</span>
                        <span className="font-mono font-semibold text-slate-200">${metrics.cac}</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={2000}
                        step={50}
                        value={metrics.cac}
                        onChange={(e) => handleMetricChange("cac", Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">LTV</span>
                        <span className="font-mono font-semibold text-purple-300">${metrics.ltv}</span>
                      </div>
                      <input
                        type="range"
                        min={300}
                        max={8000}
                        step={100}
                        value={metrics.ltv}
                        onChange={(e) => handleMetricChange("ltv", Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-violet-500"
                      />
                    </div>
                  </div>

                  {/* 7. Churn Rate */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-amber-400" />
                        Monthly Customer Churn
                      </label>
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        {(metrics.churn_rate * 100).toFixed(1)}% / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.005}
                      max={0.12}
                      step={0.005}
                      value={metrics.churn_rate}
                      onChange={(e) => handleMetricChange("churn_rate", Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                  </div>
                </div>
              ) : (
                /* Tab 2: Pitch Deck Ingestion */
                <div className="mt-6 space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer rounded-2xl border-2 border-dashed border-violet-500/40 bg-[#0f0f1e]/80 p-8 text-center transition-all hover:border-violet-500 hover:bg-[#131326]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-purple-300 ring-1 ring-violet-500/30 group-hover:scale-110 transition-transform">
                      {isUploading ? (
                        <RefreshCw className="h-6 w-6 animate-spin text-purple-300" />
                      ) : (
                        <UploadCloud className="h-6 w-6" />
                      )}
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-white">
                      {isUploading ? "Extracting Financials & Signals..." : "Upload Pitch Deck Document"}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Supports PDF pitch decks and slide scans. PyPDF2 & Tesseract extract metrics automatically.
                    </p>
                    <span className="mt-3 inline-block rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-purple-300 border border-violet-500/30">
                      Select PDF or Drop Here
                    </span>
                  </div>

                  {/* Extracted Metrics Feedback Card */}
                  {uploadedDeckInfo && (
                    <div className="rounded-xl border border-violet-500/30 bg-[#0c0c1a] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">
                            {uploadedDeckInfo.filename} ({uploadedDeckInfo.page_count} pages)
                          </span>
                        </div>
                        <span className="rounded bg-emerald-950/60 text-emerald-300 text-[10px] font-mono px-2 py-0.5 border border-emerald-800/40">
                          NLP Parsed
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-purple-300">Detected Indicators:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {uploadedDeckInfo.extraction_highlights?.map((h: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-800"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setLeftTab("sandbox")}
                        className="w-full mt-2 rounded-lg bg-violet-600/30 py-2 text-xs font-semibold text-purple-300 hover:bg-violet-600/50 transition-all border border-violet-500/40 flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Fine-Tune Extracted Values in Sandbox
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Save Snapshot Controls (Convex Sync) */}
              <div className="mt-6 border-t border-slate-800/80 pt-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Save Snapshot to Convex Layer
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Plan A: Hire 2 Eng"
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    className="flex-1 rounded-lg bg-black/60 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={handleSaveCurrentSnapshot}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      justSaved
                        ? "bg-emerald-600 text-white"
                        : "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30"
                    }`}
                  >
                    {justSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    {justSaved ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* Target 85% Resilience Solver Panel */}
            <div className="rounded-2xl border border-violet-500/30 bg-[#0c0c1a] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-300" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tier 1 Resilience Solver (85% Target)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-violet-950/50 px-2 py-0.5 rounded border border-violet-800/40">
                  {gapToTier1 > 0 ? `+${(gapToTier1 * 100).toFixed(1)}% Gap` : "Achieved 🎉"}
                </span>
              </div>

              {gapToTier1 > 0 ? (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="leading-relaxed text-[11px] text-slate-400">
                    Calculated high-leverage adjustments to graduate your startup into <strong className="text-white">Tier 1 Sovereign Growth</strong>:
                  </p>
                  <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800/70 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-rose-300">
                      <span>• Reduce Monthly Burn:</span>
                      <span className="font-bold">-${suggestedBurnReduction.toLocaleString()} / mo</span>
                    </div>
                    <div className="flex items-center justify-between text-purple-300">
                      <span>• OR Extend Runway:</span>
                      <span className="font-bold">+{suggestedRunwayExtension} Months</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  🌟 Outstanding: Digital Twin is in Tier 1 Sovereign Growth status. Ready for Series A investor syndication.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Digital Twin Projections, Charts & Prescriptions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Score Banner: Survival Probability & Risk Category */}
            <div className="glass-panel relative overflow-hidden rounded-2xl p-6 border border-violet-500/30">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Digital Twin Survival Odds
                    </span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-violet-500/30">
                      XGBoost Calibrated
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className={`font-mono text-5xl font-extrabold tracking-tight ${theme.text}`}>
                      {Math.round(survivalProbability * 100)}%
                    </span>

                    {/* Comparison Delta Badge with clean padding */}
                    {deltaOdds !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono border shadow-sm ${
                          deltaOdds > 0
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/50 shadow-emerald-950/40"
                            : "bg-rose-950/70 text-rose-300 border-rose-700/50 shadow-rose-950/40"
                        }`}
                      >
                        {deltaOdds > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                        )}
                        {deltaOdds > 0 ? `+${deltaOdds}%` : `${deltaOdds}%`}
                      </span>
                    )}
                  </div>

                  {/* High-visibility dedicated Confidence Interval chip */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">95% CI:</span>
                    <span className="font-mono font-medium text-purple-300">
                      {(confidenceInterval[0] * 100).toFixed(1)}% – {(confidenceInterval[1] * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Risk Tier Badge */}
                <div className="flex flex-col items-end">
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ring-1 ${theme.border} bg-[#0c0c17] ${theme.text}`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full ${theme.bg} animate-ping`}></div>
                    {riskTier}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1.5 font-mono">
                    Updated: {lastSyncedTime || "Just now"}
                  </span>
                </div>
              </div>

              {/* Survival Progress Bar */}
              <div className="mt-5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-purple-300 transition-all duration-500 ease-out"
                    style={{ width: `${Math.round(survivalProbability * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Quick KPIs */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
                <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase">Effective Runway</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">
                    {twinSummary.effective_runway || metrics.runway_months} mo
                  </p>
                </div>

                <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase">LTV : CAC</span>
                  <p className="text-base font-bold font-mono text-purple-300 mt-0.5">
                    {(metrics.ltv / Math.max(metrics.cac, 1)).toFixed(1)}x
                  </p>
                </div>

                <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase">Net Monthly Burn</span>
                  <p className="text-base font-bold font-mono text-rose-300 mt-0.5">
                    ${Math.max(0, metrics.monthly_burn_rate - metrics.mrr).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase">Evaluated Vectors</span>
                  <p className="text-base font-bold font-mono text-blue-400 mt-0.5">
                    44 Features
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Charting Component */}
            <ChartSwitcher drivers={shapDrivers} survivalProbability={survivalProbability} />

            {/* Prescriptive Actionable Guidance */}
            <div className="glass-panel rounded-2xl p-6 border border-violet-500/20">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20 text-purple-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Prescriptive Strategy Guidance</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Autonomous Playbook Engine
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c0c17]/80 p-3.5 transition-all hover:border-violet-500/30"
                    >
                      <ChevronRight className="h-4 w-4 text-purple-300 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">{rec}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-2">
                    Analyzing feature attributions to synthesize strategic prescriptions...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Simulation Timeline & Convex Snapshot Comparison */}
        <div className="glass-panel rounded-2xl p-6 border border-violet-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-purple-300 border border-violet-500/30">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Simulation Timeline & Snapshot History</h3>
                <p className="text-xs text-slate-400">
                  Convex Reactive Layer: compare scenarios and restore any historical digital twin projection.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {snapshots.length} Stored Scenarios
            </span>
          </div>

          {/* Snapshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {snapshots.map((snap) => {
              const isSelected = snap.id === activeSnapshotId;
              const prob = Math.round(snap.digitalTwinProjections.survivalProbability * 100);
              return (
                <div
                  key={snap.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-violet-500 bg-[#131326] ring-1 ring-violet-500/40 shadow-lg"
                      : "border-slate-800/80 bg-[#0a0a14] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white truncate">{snap.name}</span>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete snapshot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-extrabold text-purple-300">{prob}%</span>
                    <span className="text-[11px] text-slate-400 font-medium">survival probability</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 border-t border-slate-800/60 pt-2">
                    <div>
                      <span className="text-slate-500">Burn: </span>
                      <span>${snap.metrics.monthly_burn_rate.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">MRR: </span>
                      <span>${snap.metrics.mrr.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Runway: </span>
                      <span>{snap.metrics.runway_months} mo</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Team: </span>
                      <span>{snap.metrics.team_size}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-[10px] text-slate-500 font-mono">{snap.timestamp}</span>
                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white bg-violet-600/20 hover:bg-violet-600/40 px-2.5 py-1 rounded-md border border-violet-500/30 transition-all"
                    >
                      <CornerDownRight className="h-3 w-3" />
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-black/90 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Startup Sphere • Prescriptive Predictive Analytics Microservice & Digital Twin</span>
          <span className="font-mono text-[11px] text-slate-600">FastAPI ML Engine (Port 8000) • Next.js App Router (Port 3000) • Convex Reactive Layer</span>
        </div>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ConvexClientProvider>
      <DashboardContent />
    </ConvexClientProvider>
  );
}
