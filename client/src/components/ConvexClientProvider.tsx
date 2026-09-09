"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export interface SimulationSnapshot {
  id: string;
  name: string;
  timestamp: string;
  metrics: {
    mrr: number;
    monthly_burn_rate: number;
    runway_months: number;
    founder_experience_years: number;
    team_size: number;
    cac: number;
    ltv: number;
    churn_rate: number;
    net_revenue_retention?: number;
    gross_margin?: number;
  };
  digitalTwinProjections: {
    survivalProbability: number;
    riskTier: string;
    confidenceInterval: [number, number];
    shapAttributions?: Record<string, number>;
    prescriptiveRecommendations: string[];
    simulatedAt: string;
  };
}

interface ConvexContextValue {
  isConfigured: boolean;
  snapshots: SimulationSnapshot[];
  activeSnapshotId: string | null;
  saveSnapshot: (name: string, data: Omit<SimulationSnapshot, "id" | "name" | "timestamp">) => string;
  deleteSnapshot: (id: string) => void;
  loadSnapshot: (id: string) => SimulationSnapshot | undefined;
}

const ConvexSyncContext = createContext<ConvexContextValue>({
  isConfigured: false,
  snapshots: [],
  activeSnapshotId: null,
  saveSnapshot: () => "",
  deleteSnapshot: () => {},
  loadSnapshot: () => undefined,
});

export const useConvexSync = () => useContext(ConvexSyncContext);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convexClient: ConvexReactClient | null = null;
if (convexUrl) {
  try {
    convexClient = new ConvexReactClient(convexUrl);
  } catch (e) {
    console.warn("Convex client init notice:", e);
  }
}

// Initial seed snapshot for comparison
const initialSeedSnapshots: SimulationSnapshot[] = [
  {
    id: "snap_initial_baseline",
    name: "Pre-Seed Baseline",
    timestamp: "10:00 AM",
    metrics: {
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
    },
    digitalTwinProjections: {
      survivalProbability: 0.76,
      riskTier: "Tier 2: Balanced / Seed Viability",
      confidenceInterval: [0.71, 0.81],
      prescriptiveRecommendations: [
        "✅ Runway Bridge (14 mos): Adequate cash buffer to achieve Series A valuation milestones.",
        "🚀 Strong Unit Economics: LTV:CAC is 4.1x.",
      ],
      simulatedAt: new Date().toISOString(),
    },
  },
  {
    id: "snap_high_burn",
    name: "Aggressive Hiring Scenario",
    timestamp: "10:30 AM",
    metrics: {
      mrr: 22000,
      monthly_burn_rate: 65000,
      runway_months: 8,
      founder_experience_years: 4,
      team_size: 12,
      cac: 750,
      ltv: 2100,
      churn_rate: 0.045,
      net_revenue_retention: 1.10,
      gross_margin: 0.72,
    },
    digitalTwinProjections: {
      survivalProbability: 0.54,
      riskTier: "Tier 3: Moderate Vulnerability / Runway Watch",
      confidenceInterval: [0.48, 0.60],
      prescriptiveRecommendations: [
        "🚨 Urgent Runway Alert (8 mos): Cash reserves represent critical downside risk.",
        "📉 High Burn Multiple: Monthly burn ($65,000) is 3.0x MRR.",
      ],
      simulatedAt: new Date().toISOString(),
    },
  },
];

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [snapshots, setSnapshots] = useState<SimulationSnapshot[]>(initialSeedSnapshots);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>("snap_initial_baseline");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("startup_sphere_snapshots_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSnapshots(parsed);
        }
      }
    } catch (e) {
      // Local storage unavailable or SSR
    }
  }, []);

  const saveSnapshot = (name: string, data: Omit<SimulationSnapshot, "id" | "name" | "timestamp">): string => {
    const id = `snap_${Date.now()}`;
    const newSnapshot: SimulationSnapshot = {
      ...data,
      id,
      name: name || `Simulation ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSnapshots((prev) => {
      const updated = [newSnapshot, ...prev].slice(0, 30);
      try {
        localStorage.setItem("startup_sphere_snapshots_v2", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveSnapshotId(id);
    return id;
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("startup_sphere_snapshots_v2", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const loadSnapshot = (id: string): SimulationSnapshot | undefined => {
    const snap = snapshots.find((s) => s.id === id);
    if (snap) {
      setActiveSnapshotId(id);
    }
    return snap;
  };

  const contextValue: ConvexContextValue = {
    isConfigured: !!convexClient,
    snapshots,
    activeSnapshotId,
    saveSnapshot,
    deleteSnapshot,
    loadSnapshot,
  };

  if (convexClient) {
    return (
      <ConvexProvider client={convexClient}>
        <ConvexSyncContext.Provider value={contextValue}>
          {children}
        </ConvexSyncContext.Provider>
      </ConvexProvider>
    );
  }

  return (
    <ConvexSyncContext.Provider value={contextValue}>
      {children}
    </ConvexSyncContext.Provider>
  );
}
