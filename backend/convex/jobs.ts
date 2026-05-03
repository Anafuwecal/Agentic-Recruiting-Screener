import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    required_skills: v.array(v.string()),
    nice_to_have: v.array(v.string()),
    minimum_experience_years: v.number(),
    portfolio_required: v.boolean(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    created_date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("jobs"),
    title: v.optional(v.string()),
    required_skills: v.optional(v.array(v.string())),
    nice_to_have: v.optional(v.array(v.string())),
    minimum_experience_years: v.optional(v.number()),
    portfolio_required: v.optional(v.boolean()),
    description: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    return await ctx.db.patch(id, updates);
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getActive = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .first();
  },
});

export const list = query({
  handler: async (ctx) => {
    const jobs = await ctx.db.query("jobs").collect();
    return jobs.sort((a, b) => 
      new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    );
  },
});