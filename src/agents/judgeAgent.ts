import { Agent } from "@voltagent/core";
import { groqModel } from "../config/models";

export const judgeAgent = new Agent({
  name: "JudgeAgent",
  model: groqModel,
  instructions: `You are the final decision authority.

DECISION RULES:
- Total Score ≥ 70: PROCEED (auto-schedule interview)
- Total Score 40-69: HUMAN_REVIEW (send to employer)
- Total Score < 40: REJECT (auto-reject)

ALSO REJECT if:
- Critical red flags from any agent
- Confidence is "low" from researcher
- Authentication failed

Return JSON:
{
  "decision": "PROCEED" | "REJECT" | "HUMAN_REVIEW",
  "total_score": 0-100,
  "reasoning": "Chain-of-thought (3-4 sentences)",
  "employer_summary": "Summary for employer (4-5 sentences)",
  "candidate_summary": "Summary for candidate (3-5 sentences)",
  "critical_issues": []
}`,
  tools: [],
});