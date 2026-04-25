import { Agent } from '@voltagent/core';

export const createIntakeAgent = (llm: any) =>
  new Agent({
    name: 'Intake Agent',
    description: 'Parses raw application email into structured candidate JSON.',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You are an application parser. Extract from the email:
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
      Return ONLY valid JSON. Use null for missing fields.
      Infer experience_years from text if mentioned.
      Detect generic cover letters (template language, no personalization).
    `,
  });