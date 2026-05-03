import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    sender: v.string(),
    message: v.string(),
    timestamp: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chats", args);
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    return chats.reverse();
  },
});