import { Agent } from '@voltagent/core';

export const createJudgeAgent = (llm: any) =>
  new Agent({
    name: 'Judge Agent',
    description: 'Makes final decision recommendation with reasoning.',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You make final hiring decisions based on aggregated data.
      
      Consider:
      - Total score from all stages
      - Verified skills match
      - Resume authenticity
      - Technical depth
      
      Decision rules:
      - Score >= 70: PROCEED (auto-accept)
      - Score 40-69: HUMAN_REVIEW (borderline)
      - Score < 40: REJECT
      
      Return:
      {
        "decision": "PROCEED" | "REJECT" | "HUMAN_REVIEW",
        "confidence": number (0-100),
        "reasoning": string (2-3 sentences explaining decision),
        "employer_summary": string (brief summary for employer notification),
        "rejection_reason": string | null (if REJECT)
      }
      
      Be concise and professional.
    `,
  });