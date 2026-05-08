import { VoltAgent, Agent } from "@voltagent/core";
import { groq } from "@ai-sdk/groq"; // Import the Groq provider
import { z } from "zod";
import { jobRequirements } from "../config/jobRequirements";


export const intakeAgent = new Agent({
  name: "IntakeAgent",
  model: groq("llama-3.1-8b-instant"),
  instructions: `You are an expert recruitment email parser.

CRITICAL MISSION: Extract ALL candidate information and detect IMMEDIATE REJECTION scenarios.

JOB REQUIREMENTS:
- Required Skills: ${jobRequirements.critical_requirements.required_skills.join(", ")}
- Must Have GitHub: ${jobRequirements.critical_requirements.must_have_github}
- Must Have Portfolio: ${jobRequirements.critical_requirements.must_have_portfolio}
- Min Experience: ${jobRequirements.critical_requirements.min_experience_years} years

SCORING (Total: 100):
- GitHub URL: ${jobRequirements.scoring_weights.github} points
- Portfolio URL: ${jobRequirements.scoring_weights.portfolio} points
- Skills Match: ${jobRequirements.scoring_weights.skills_match} points
- Experience: ${jobRequirements.scoring_weights.experience} points
- Cover Letter: ${jobRequirements.scoring_weights.cover_letter} points

IMMEDIATE REJECTION TRIGGERS:
1. Missing email address
2. Missing GitHub (if required)
3. Missing Portfolio (if required)
4. ZERO overlap with required skills

Extract these fields:
- name (full name)
- email (MANDATORY)
- phone
- github_url
- portfolio_url
- skills (array)
- experience_years (number)
- education
- cover_letter_summary

Return STRICT JSON with:
{
  "extracted_data": { 
    "name": "Full Name Here",
    "email": "email@example.com",
    "phone": "+1-555-0000",
    "github_url": "https://github.com/username",
    "portfolio_url": "https://portfolio.com",
    "skills": ["React", "Node.js"],
    "experience_years": 5,
    "education": "Bachelor's Degree",
    "cover_letter_summary": "Brief summary"
  },
  "intake_score": 75,
  "immediate_rejection": false,
  "rejection_reason": "",
  "missing_fields": []
}`,
  tools: [],
});