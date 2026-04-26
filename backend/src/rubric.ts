export interface JobRequirements {
  title: string;
  required_skills: string[];
  nice_to_have: string[];
  minimum_experience_years: number;
  portfolio_required: boolean;
}

export const SCORING = {
  intake: {
    max: 30,
    weights: {
      has_portfolio: 10,
      cover_letter_quality: 10,
      skill_match: 10,
    },
  },
  research: {
    max: 30,
    weights: {
      no_resume_fluff: 15,
      github_activity: 15,
    },
  },
  screener: {
    max: 40,
    weights: {
      technical_depth: 40,
    },
  },
  thresholds: {
    auto_reject_below: 40,
    human_review: [40, 69] as [number, number],
    auto_proceed: 70,
  },
};

// This will be loaded from database dynamically
export let JOB_REQUIREMENTS: JobRequirements = {
  title: 'AI/Fullstack Engineer',
  required_skills: ['TypeScript', 'Node.js', 'React', 'AI/LLM'],
  nice_to_have: ['VoltAgent', 'LangGraph', 'Python', 'Docker'],
  minimum_experience_years: 2,
  portfolio_required: true,
};

export function updateJobRequirements(newRequirements: JobRequirements) {
  JOB_REQUIREMENTS = newRequirements;
}