import { mutation } from "./_generated/server";

export const seedScoringRules = mutation({
  handler: async (ctx) => {
    const rules = [
      {
        ruleName: "Has GitHub Profile",
        category: "intake",
        maxPoints: 30,
        criteria: "GitHub URL provided and valid",
        enabled: true,
      },
      {
        ruleName: "Has Portfolio",
        category: "intake",
        maxPoints: 30,
        criteria: "Portfolio URL provided and accessible",
        enabled: true,
      },
      {
        ruleName: "Cover Letter Quality",
        category: "intake",
        maxPoints: 20,
        criteria: "Well-written, specific, demonstrates interest",
        enabled: true,
      },
      {
        ruleName: "Skills Listed",
        category: "intake",
        maxPoints: 10,
        criteria: "Technical skills clearly mentioned",
        enabled: true,
      },
      {
        ruleName: "Experience Provided",
        category: "intake",
        maxPoints: 10,
        criteria: "Years of experience or relevant work history",
        enabled: true,
      },
      {
        ruleName: "GitHub Activity",
        category: "research",
        maxPoints: 20,
        criteria: "Active GitHub with recent commits (< 6 months)",
        enabled: true,
      },
      {
        ruleName: "Portfolio Legitimacy",
        category: "research",
        maxPoints: 15,
        criteria: "Portfolio is indexed and belongs to candidate",
        enabled: true,
      },
      {
        ruleName: "Online Presence",
        category: "research",
        maxPoints: 15,
        criteria: "Professional presence (blog, Stack Overflow, etc.)",
        enabled: true,
      },
      {
        ruleName: "Skill Match",
        category: "screening",
        maxPoints: 20,
        criteria: "Claimed skills match verified GitHub languages",
        enabled: true,
      },
      {
        ruleName: "Technical Depth",
        category: "screening",
        maxPoints: 15,
        criteria: "Demonstrated technical expertise",
        enabled: true,
      },
      {
        ruleName: "Project Complexity",
        category: "screening",
        maxPoints: 15,
        criteria: "GitHub projects show complexity and quality",
        enabled: true,
      },
    ];

    for (const rule of rules) {
      await ctx.db.insert("scoring_rules", rule);
    }

    return { success: true, count: rules.length };
  },
});