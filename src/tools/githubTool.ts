import { z } from "zod";
import axios from "axios";

export const githubAnalysisTool = {
  name: "analyze_github",
  description: "Analyzes a GitHub profile and returns detailed information",
  parameters: z.object({
    github_url: z.string().url(),
  }),
  execute: async ({ github_url }: { github_url: string }) => {
    try {
      const username = github_url.split("github.com/")[1]?.split("/")[0];
      if (!username) throw new Error("Invalid GitHub URL");

      const headers = {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      };

      // Get user profile
      const userRes = await axios.get(
        `https://api.github.com/users/${username}`,
        { headers }
      );

      // Get repositories
      const reposRes = await axios.get(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        { headers }
      );

      const repos = reposRes.data;
      const languages = new Set<string>();
      const repoDetails = [];

      for (const repo of repos.slice(0, 5)) {
        if (repo.language) languages.add(repo.language);

        let lastCommitDate = repo.updated_at;
        try {
          const commitsRes = await axios.get(
            `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`,
            { headers }
          );
          if (commitsRes.data[0]) {
            lastCommitDate = commitsRes.data[0].commit.committer.date;
          }
        } catch (e) {
          // Empty repo
        }

        repoDetails.push({
          name: repo.name,
          language: repo.language,
          stars: repo.stargazers_count,
          last_commit: lastCommitDate,
        });
      }

      // Activity score
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentRepos = repoDetails.filter(
        (r) => new Date(r.last_commit) > sixMonthsAgo
      );

      return {
        username,
        profile: {
          name: userRes.data.name,
          bio: userRes.data.bio,
          followers: userRes.data.followers,
          public_repos: userRes.data.public_repos,
        },
        languages: Array.from(languages),
        repositories: repoDetails,
        activity_score: (recentRepos.length / 5) * 100,
        is_active: recentRepos.length > 0,
      };
    } catch (error: any) {
      return {
        error: error.message,
        is_active: false,
        activity_score: 0,
      };
    }
  },
};