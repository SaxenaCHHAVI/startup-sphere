"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { BarChart3, TrendingUp, Layers, HelpCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface ShapDriver {
  feature: string;
  raw_key: string;
  attribution: number;
  direction: "positive" | "negative";
  magnitude: number;
}

interface ChartSwitcherProps {
  drivers: ShapDriver[];
  survivalProbability?: number;
}

type ChartType = "bar" | "line" | "area";

export default function ChartSwitcher({ drivers, survivalProbability = 0.76 }: ChartSwitcherProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [filterMode, setFilterMode] = useState<"all" | "positive" | "negative">("all");

  // Filter data according to user toggle
  const filteredData = drivers.filter((item) => {
    if (filterMode === "positive") return item.attribution >= 0;
    if (filterMode === "negative") return item.attribution < 0;
    return true;
  });

  // Calculate cumulative baseline trajectory for line/area views
  let runningVal = survivalProbability * 100;
  const trajectoryData = drivers.map((item) => {
    runningVal += item.attribution * 100;
    return {
      feature: item.feature,
      attribution: Math.round(item.attribution * 1000) / 10, // in percentage points
      cumulativeScore: Math.round(Math.max(5, Math.min(99, runningVal)) * 10) / 10,
      direction: item.direction,
      magnitude: Math.round(item.magnitude * 1000) / 10,
    };
  });

  const chartData = chartType === "bar"
    ? filteredData.map((d) => ({
        feature: d.feature,
        attribution: Math.round(d.attribution * 1000) / 10, // percentage point impact
        direction: d.direction,
        magnitude: Math.round(d.magnitude * 1000) / 10,
      }))
    : trajectoryData;

  // Custom Violet & Lavender Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.attribution >= 0;

      return (
        <div className="rounded-xl border border-violet-500/30 bg-[#0c0c17]/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                isPositive ? "bg-violet-500/20 text-lavender-300 text-purple-300" : "bg-blue-600/20 text-blue-400"
              }`}
            >
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            </span>
            <span className="font-semibold text-slate-100 text-sm">{label || data.feature}</span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">SHAP Delta:</span>
              <span
                className={`font-mono font-bold ${
                  isPositive ? "text-purple-300" : "text-blue-400"
                }`}
              >
                {data.attribution > 0 ? `+${data.attribution}%` : `${data.attribution}%`}
              </span>
            </div>

            {chartType !== "bar" && data.cumulativeScore !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Simulated Odds:</span>
                <span className="font-mono font-semibold text-violet-400">
                  {data.cumulativeScore}%
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/60">
              <span className="text-slate-500">Significance:</span>
              <span className="text-slate-300 font-medium capitalize">
                {Math.abs(data.attribution) > 4 ? "High Impact" : "Moderate Impact"}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel w-full rounded-2xl p-5 md:p-6 transition-all border border-violet-500/20">
      {/* Header with Switcher Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse"></span>
              SHAP Feature Attributions
            </h3>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-violet-500/30">
              XGBoost TreeExplainer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directional attribution vectors showing what is elevating or depressing digital twin survival odds.
          </p>
        </div>

        {/* View Mode & Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggles */}
          <div className="inline-flex rounded-lg bg-[#0f0f1c] p-1 border border-slate-800">
            <button
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "bar"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "line"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Trajectory
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "area"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Area
            </button>
          </div>

          {/* Bar Filter Sub-toggle */}
          {chartType === "bar" && (
            <div className="inline-flex rounded-lg bg-[#0f0f1c] p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2 py-1 rounded transition-all ${
                  filterMode === "all" ? "bg-slate-800 text-purple-300 font-semibold" : "text-slate-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode("positive")}
                className={`px-2 py-1 rounded transition-all ${
                  filterMode === "positive" ? "bg-violet-950/70 text-purple-300 font-semibold" : "text-slate-400"
                }`}
              >
                + Lift
              </button>
              <button
                onClick={() => setFilterMode("negative")}
                className={`px-2 py-1 rounded transition-all ${
                  filterMode === "negative" ? "bg-blue-950/70 text-blue-300 font-semibold" : "text-slate-400"
                }`}
              >
                - Drag
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="mt-6 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={true}
                stroke="#1e293b"
                opacity={0.6}
              />
              <XAxis
                type="number"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={["dataMin - 1", "dataMax + 1"]}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#64748b"
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139, 92, 246, 0.08)" }} />
              <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
              <Bar dataKey="attribution" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.attribution >= 0 ? "#8b5cf6" : "#2563eb"}
                    stroke={entry.attribution >= 0 ? "#d8b4fe" : "#60a5fa"}
                    strokeWidth={1}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
            >
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#d8b4fe" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="feature"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[20, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Risk Threshold", fill: "#ef4444", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="cumulativeScore"
                name="Cumulative Odds"
                stroke="url(#lineGlow)"
                strokeWidth={3}
                dot={{ fill: "#d8b4fe", stroke: "#8b5cf6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, fill: "#ffffff", stroke: "#8b5cf6", strokeWidth: 3 }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                  <stop offset="50%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="feature"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[20, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulativeScore"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Color Key Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-violet-500 ring-1 ring-purple-300/50"></span>
            <span className="text-slate-300 font-medium">Positive Odds Catalyst (Violet / Lavender)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-600 ring-1 ring-blue-400/50"></span>
            <span className="text-slate-300 font-medium">Drag / Risk Factor (Royal Blue)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Attribution indicates deviation from baseline prior.</span>
        </div>
      </div>
    </div>
  );
}
