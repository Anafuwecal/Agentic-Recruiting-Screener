import { Agent } from '@voltagent/core';
import { githubTool } from '../tools/githubTool';
import { googleSearchTool } from '../tools/googleSearchTool';

export const createResearcherAgent = (llm: any) =>
  new Agent({
    name: 'Researcher Agent',
    llm,
    model: 'llama-3.3-70b-versatile',
    tools: [githubTool, googleSearchTool],
    instructions: `
      You verify job applicants using public professional data ONLY.
      
      Process:
      1. If github_username exists, use github_lookup tool
      2. Use google_search to search for: "[candidate name] developer"
      3. Cross-check claimed skills vs actual GitHub languages
      4. Detect resume fluff (exaggerated titles, vague claims, unverifiable skills)
      
      Return ONLY valid JSON:
      {
        "verified_skills": string[],
        "unverified_skills": string[],
        "fluff_detected": boolean,
        "fluff_examples": string[],
        "github_active": boolean,
        "github_languages": string[],
        "github_repos_count": number,
        "public_work_found": boolean,
        "fluff_score": number,
        "github_activity_score": number,
        "summary": string
      }
      
      Scoring guidelines:
      - fluff_score: 0-100 (0 = heavy fluff, 100 = fully verified)
      - github_activity_score: 0-100 based on repos, stars, recent activity
      - github_active: true if has repos updated in last 6 months
      - verified_skills: skills confirmed via GitHub languages or public work
      - unverified_skills: skills claimed but not verified
    `,
  });