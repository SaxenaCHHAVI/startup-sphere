import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveSimulation = mutation({
  args: {
    founderId: v.string(),
    companyName: v.optional(v.string()),
    metrics: v.object({
      mrr: v.number(),
      monthlyBurnRate: v.number(),
      runwayMonths: v.number(),
      founderExperienceYears: v.number(),
      teamSize: v.number(),
      cac: v.number(),
      ltv: v.number(),
      churnRate: v.number(),
      growthRateMom: v.optional(v.number()),
      grossMargin: v.optional(v.number()),
      cashBalance: v.optional(v.number()),
      totalCapitalRaised: v.optional(v.number()),
    }),
    digitalTwinProjections: v.object({
      survivalProbability: v.number(),
      riskTier: v.string(),
      confidenceInterval: v.array(v.number()),
      shapAttributions: v.record(v.string(), v.number()),
      prescriptiveRecommendations: v.array(v.string()),
      simulatedAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const simulationId = await ctx.db.insert("startups", {
      founderId: args.founderId,
      companyName: args.companyName || "Stealth AI Startup",
      metrics: args.metrics,
      digitalTwinProjections: args.digitalTwinProjections,
    });
    return simulationId;
  },
});

export const getLatestSimulation = query({
  args: { founderId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("startups")
      .withIndex("by_founder", (q) => q.eq("founderId", args.founderId))
      .order("desc")
      .take(1);
    return results[0] || null;
  },
});

export const listSimulations = query({
  args: { founderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("startups")
      .withIndex("by_founder", (q) => q.eq("founderId", args.founderId))
      .order("desc")
      .take(20);
  },
});
