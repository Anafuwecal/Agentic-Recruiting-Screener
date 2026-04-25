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
    human_review: [40, 69],
    auto_proceed: 70,
  },
};