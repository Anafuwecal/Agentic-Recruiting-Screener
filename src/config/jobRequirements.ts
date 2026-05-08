export const jobRequirements = {
  position: "Senior Full Stack Developer",
  critical_requirements: {
    must_have_github: true,
    must_have_portfolio: true,
    required_skills: ["JavaScript", "React", "Node.js"],
    min_experience_years: 3,
  },
  scoring_weights: {
    github: 30,
    portfolio: 30,
    skills_match: 20,
    experience: 10,
    cover_letter: 10,
  },
  auto_reject_if: {
    missing_github: true,
    missing_portfolio: true,
    skill_match_below: 50,
  },
};