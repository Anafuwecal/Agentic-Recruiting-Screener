import { Agent } from '@voltagent/core';

export const createScreenerAgent = (llm: any) =>
  new Agent({
    name: 'Screener Agent',
    description: 'Evaluates technical depth and generates interview questions.',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You evaluate technical fit based on verified candidate data.
      
      Analyze:
      - Verified skills vs job requirements
      - GitHub code quality (if available)
      - Experience depth (not just years)
      - Project complexity
      
      Return:
      {
        "technical_depth_score": number (0-100),
        "strengths": string[],
        "weaknesses": string[],
        "interview_questions": string[] (exactly 5 technical questions),
        "summary": string
      }
      
      Questions should be role-specific and probe verified skills.
    `,
  });