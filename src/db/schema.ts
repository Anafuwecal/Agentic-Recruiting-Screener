import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  candidates: defineTable({
    name: v.string(),
    email: v.string(),
    githubUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  applications: defineTable({
    candidateId: v.string(), // Reference ID string from candidates table
    threadId: v.string(),    // Unique LangGraph Thread ID
    status: v.union(
      v.literal("INTAKE"),
      v.literal("VERIFICATION"),
      v.literal("SCREENING_PENDING"),
      v.literal("SCREENING_SUBMITTED"),
      v.literal("EVALUATION"),
      v.literal("ACCEPTED"),
      v.literal("REJECTED")
    ),
    timeline: v.array(
      v.object({
        stage: v.string(),
        timestamp: v.number(),
        note: v.string(),
      })
    ),
    updatedAt: v.number(),
  }).index("by_threadId", ["threadId"])        
    .index("by_candidateId", ["candidateId"]),

  fluff_reports: defineTable({
    applicationId: v.string(),
    candidateId: v.string(),
    findings: v.array(
      v.object({
        claim: v.string(),
        findingReason: v.string(),
        severity: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH")),
        isValid: v.boolean(),
      })
    ),
    compiledAt: v.number(),
  }).index("by_applicationId", ["applicationId"]),

  audit_logs: defineTable({
    action: v.string(),
    actor: v.string(), // "SYSTEM" | "AGENT_NAME" | "USER"
    details: v.string(),
    timestamp: v.number(),
  }),
});