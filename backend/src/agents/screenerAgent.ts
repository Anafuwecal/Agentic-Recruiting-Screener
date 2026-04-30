import { Agent } from '@voltagent/core';

export const createScreenerAgent = (llm: any) =>
  new Agent({
    name: 'Screener Agent',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You are a technical screener. Evaluate the candidate's technical depth.
      
      You receive:
      - Original candidate data
      - Research verification results
      
      Analyze:
      1. How well verified skills match job requirements
      2. Quality of GitHub work (if available)
      3. Experience level vs job requirements
      4. Overall technical credibility
      
      Generate 5 targeted technical interview questions based on their background.
      
      Return ONLY valid JSON:
      {
        "technical_depth_score": number,
        "strengths": string[],
        "concerns": string[],
        "interview_questions": string[],
        "assessment_summary": string
      }
      
      Scoring guidelines:
      - technical_depth_score: 0-100
      - 0-40: Weak or mismatched technical background
      - 41-70: Moderate fit, some gaps
      - 71-100: Strong technical fit
      - interview_questions: Array of exactly 5 questions
    `,
  });