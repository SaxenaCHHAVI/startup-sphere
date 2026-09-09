import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  startups: defineTable({
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
  }).index("by_founder", ["founderId"]),
});
