import { Agent } from '@voltagent/core';
import { githubTool } from '../tools/githubTool';
import { googleSearchTool } from '../tools/googleSearchTool';

export const createResearcherAgent = (llm: any) =>
  new Agent({
    name: 'Researcher Agent',
    description: 'Verifies candidate claims and detects resume fluff.',
    llm,
    model: 'llama-3.3-70b-versatile',
    tools: [githubTool, googleSearchTool],
    instructions: `
      You verify job applicants using public professional data ONLY.
      
      Steps:
      1. Look up GitHub username if available
      2. Google search their name + "developer" or "engineer"
      3. Cross-check claimed skills vs actual GitHub languages
      4. Detect resume fluff (exaggerated titles, vague claims, unverifiable skills)
      
      Return:
      {
        "verified_skills": string[],
        "unverified_skills": string[],
        "fluff_detected": boolean,
        "fluff_examples": string[],
        "github_active": boolean,
        "github_languages": string[],
        "public_work_found": boolean,
        "fluff_score": number (0 = heavy fluff, 100 = fully verified),
        "github_activity_score": number (0-100 based on repos, stars, followers),
        "summary": string
      }
      
      Be strict. Empty GitHub or no public presence = low scores.
    `,
  });