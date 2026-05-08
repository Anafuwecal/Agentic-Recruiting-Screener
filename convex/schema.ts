import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  applicants: defineTable({
    // Basic Info
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    
    // Status Tracking
    status: v.string(), // "PENDING" | "INTAKE" | "RESEARCH" | "SCREENING" | "JUDGING" | "SCHEDULING" | "ACCEPTED" | "REJECTED" | "HUMAN_REVIEW"
    currentStage: v.string(),
    
    // Scoring
    totalScore: v.number(),
    intakeScore: v.number(),
    researchScore: v.number(),
    screeningScore: v.number(),
    
    // Agent Outputs
    intakeData: v.optional(v.any()),
    researchData: v.optional(v.any()),
    screeningData: v.optional(v.any()),
    judgeDecision: v.optional(v.any()),
    
    // Interview Details
    meetingLink: v.optional(v.string()),
    interviewTime: v.optional(v.string()),
    calendarEventId: v.optional(v.string()),
    
    // Metadata
    createdAt: v.string(),
    updatedAt: v.string(),
    rawEmail: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  audit_logs: defineTable({
    applicantId: v.id("applicants"),
    stage: v.string(),
    agentName: v.string(),
    input: v.string(),
    output: v.string(),
    score: v.number(),
    reasoning: v.string(),
    timestamp: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  }).index("by_applicant", ["applicantId"]),

  scoring_rules: defineTable({
    ruleName: v.string(),
    category: v.string(), // "intake" | "research" | "screening"
    maxPoints: v.number(),
    criteria: v.string(),
    enabled: v.boolean(),
  }),
});