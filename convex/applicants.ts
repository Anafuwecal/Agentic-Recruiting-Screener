import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    rawEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("applicants", {
      name: args.name,
      email: args.email,
      status: "PENDING",
      currentStage: "intake",
      totalScore: 0,
      intakeScore: 0,
      researchScore: 0,
      screeningScore: 0,
      createdAt: now,
      updatedAt: now,
      rawEmail: args.rawEmail,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("applicants"),
    status: v.string(),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      currentStage: args.stage,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateScore = mutation({
  args: {
    id: v.id("applicants"),
    category: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const applicant = await ctx.db.get(args.id);
    if (!applicant) throw new Error("Applicant not found");

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (args.category === "intake") {
      updates.intakeScore = args.score;
      updates.totalScore = args.score + applicant.researchScore + applicant.screeningScore;
    } else if (args.category === "research") {
      updates.researchScore = args.score;
      updates.totalScore = applicant.intakeScore + args.score + applicant.screeningScore;
    } else if (args.category === "screening") {
      updates.screeningScore = args.score;
      updates.totalScore = applicant.intakeScore + applicant.researchScore + args.score;
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const updateAgentData = mutation({
  args: {
    id: v.id("applicants"),
    category: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (args.category === "intake") updates.intakeData = args.data;
    else if (args.category === "research") updates.researchData = args.data;
    else if (args.category === "screening") updates.screeningData = args.data;
    else if (args.category === "judge") updates.judgeDecision = args.data;

    await ctx.db.patch(args.id, updates);
  },
});

export const addInterview = mutation({
  args: {
    id: v.id("applicants"),
    meetingLink: v.string(),
    interviewTime: v.string(),
    calendarEventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meetingLink: args.meetingLink,
      interviewTime: args.interviewTime,
      calendarEventId: args.calendarEventId,
      status: "ACCEPTED",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getById = query({
  args: { id: v.id("applicants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applicants")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
}); 