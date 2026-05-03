import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  candidates: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    github_url: v.optional(v.string()),
    github_username: v.optional(v.string()),
    portfolio_url: v.optional(v.string()),
    linkedin_url: v.optional(v.string()),
    skills: v.array(v.string()),
    experience_years: v.number(),
    education: v.optional(v.string()),
    previous_roles: v.optional(v.array(v.string())),
    cover_letter_summary: v.optional(v.string()),
    
    intake_score: v.number(),
    research_score: v.number(),
    screener_score: v.number(),
    total_score: v.number(),
    
    status: v.string(), // 'NEW' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'HUMAN_REVIEW'
    current_stage: v.string(),
    decision: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    
    interview_scheduled: v.optional(v.boolean()),
    interview_datetime: v.optional(v.string()),
    interview_meet_link: v.optional(v.string()),
    interview_event_link: v.optional(v.string()),
    
    application_date: v.string(),
    processed_date: v.optional(v.string()),
    job_id: v.id("jobs"),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_job", ["job_id"])
    .index("by_application_date", ["application_date"]),

  jobs: defineTable({
    title: v.string(),
    required_skills: v.array(v.string()),
    nice_to_have: v.array(v.string()),
    minimum_experience_years: v.number(),
    portfolio_required: v.boolean(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    created_date: v.string(),
  })
    .index("by_active", ["is_active"]),

  chats: defineTable({
    sender: v.string(), // 'EMPLOYER' | 'ORCHESTRATOR'
    message: v.string(),
    timestamp: v.string(),
    metadata: v.optional(v.any()),
  })
    .index("by_timestamp", ["timestamp"]),
});