import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
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
    status: v.string(),
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("candidates", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("candidates"),
    // All updateable fields as optional
    status: v.optional(v.string()),
    current_stage: v.optional(v.string()),
    decision: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    intake_score: v.optional(v.number()),
    research_score: v.optional(v.number()),
    screener_score: v.optional(v.number()),
    total_score: v.optional(v.number()),
    interview_scheduled: v.optional(v.boolean()),
    interview_datetime: v.optional(v.string()),
    interview_meet_link: v.optional(v.string()),
    interview_event_link: v.optional(v.string()),
    processed_date: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    return await ctx.db.patch(id, updates);
  },
});

export const get = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const list = query({
  args: {
    jobId: v.optional(v.id("jobs")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, status }) => {
    let query = ctx.db.query("candidates");

    if (jobId) {
      query = query.withIndex("by_job", (q) => q.eq("job_id", jobId));
    }

    if (status) {
      query = query.withIndex("by_status", (q) => q.eq("status", status));
    }

    const candidates = await query.collect();
    return candidates.sort((a, b) => 
      new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
    );
  },
});