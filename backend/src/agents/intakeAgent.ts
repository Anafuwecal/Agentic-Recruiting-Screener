import { Agent } from '@voltagent/core';

export const createIntakeAgent = (llm: any) =>
  new Agent({
    name: 'Intake Agent',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You are an application parser for job applications. 
      Extract from the email body all relevant candidate information.
      
      Return ONLY valid JSON with this exact structure:
      {
        "name": string,
        "email": string,
        "phone": string | null,
        "github_url": string | null,
        "github_username": string | null,
        "portfolio_url": string | null,
        "linkedin_url": string | null,
        "skills": string[],
        "experience_years": number,
        "education": string,
        "previous_roles": string[],
        "cover_letter_summary": string,
        "has_portfolio": boolean,
        "cover_letter_is_generic": boolean
      }
      
      Guidelines:
      - Extract github_username from github_url if present
      - skills should be an array of specific technical skills
      - experience_years should be a number
      - cover_letter_is_generic: true if the letter seems template-based
      - has_portfolio: true if portfolio_url or github_url exists
      - Use null for truly missing fields
      - No extra text, only JSON
    `,
  });