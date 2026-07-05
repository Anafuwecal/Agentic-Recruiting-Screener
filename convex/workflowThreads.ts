import { mutation, query } from "./_generated/server.js";
import { v } from "convex/values";

export const updateState = mutation({
  args: {
    threadId: v.string(),
    candidateId: v.optional(v.string()),
    graphState: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflowThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();

    // 1. Extract required schema fields from graphState (with fallbacks)
    const status = args.graphState?.pipelineStatus || "INTAKE";
    const timeline = args.graphState?.timeline || [];

    // 2. Build the payload dynamically so we don't pass `undefined` values,
    // which violates exactOptionalPropertyTypes in TypeScript.
    const payload: any = {
      threadId: args.threadId,
      graphState: args.graphState,
      updatedAt: args.updatedAt,
      status,
      timeline,
    };

    // 3. Only attach candidateId if it explicitly exists
    if (args.candidateId !== undefined) {
      payload.candidateId = args.candidateId;
    }

    // 4. Execute the DB operation
    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("workflowThreads", payload);
    }
  },
});

export const getState = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("workflowThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .first();
    
    return thread;
  },
});