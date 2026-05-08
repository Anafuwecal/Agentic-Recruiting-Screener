import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    applicantId: v.id("applicants"),
    stage: v.string(),
    agentName: v.string(),
    input: v.string(),
    output: v.string(),
    score: v.number(),
    reasoning: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audit_logs", {
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});

export const getByApplicant = query({
  args: { applicantId: v.id("applicants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audit_logs")
      .withIndex("by_applicant", (q) => q.eq("applicantId", args.applicantId))
      .collect();
  },
});