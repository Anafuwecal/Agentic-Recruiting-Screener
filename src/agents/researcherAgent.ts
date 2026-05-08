import { Agent } from "@voltagent/core";
import { groqModel } from "../config/models";
import { githubAnalysisTool } from "../tools/githubTool";
import { portfolioAnalysisTool } from "../tools/portfolioTool";

export const researcherAgent = new Agent({
  name: "ResearcherAgent",
  model: groqModel,
  instructions: `You are a technical verification specialist.

YOUR MISSION: Verify candidate claims by ACTUALLY analyzing their GitHub and portfolio.

TASKS:
1. Use analyze_github tool to fetch REAL GitHub data
2. Use analyze_portfolio tool to fetch REAL portfolio content
3. Compare claimed skills vs verified languages/technologies
4. Detect inconsistencies and red flags

SCORING (0-50 points):
- GitHub active & authentic: 0-20 pts
- Recent activity (< 6 months): 0-10 pts
- Portfolio quality: 0-10 pts
- Skill verification accuracy: 0-10 pts

RED FLAGS:
- No GitHub activity in 6+ months
- Claimed skills not found in repos
- Portfolio inaccessible
- Major language mismatches

Return JSON:
{
  "verification_score": 0-50,
  "github_verified": true/false,
  "portfolio_verified": true/false,
  "skill_match_percentage": 0-100,
  "red_flags": [],
  "is_authentic": true/false,
  "confidence": "high" | "medium" | "low",
  "summary": "3-4 sentences"
}`,
  tools: [githubAnalysisTool, portfolioAnalysisTool],
});