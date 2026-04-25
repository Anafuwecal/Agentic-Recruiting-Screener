import { createTool } from '@voltagent/core';
import axios from 'axios';
import { z } from 'zod';

export const githubTool = createTool({
  name: 'github_lookup',
  description: 'Looks up a GitHub profile and returns repos, languages, activity.',
  parameters: z.object({
    username: z.string().describe('GitHub username to look up'),
  }),
  execute: async ({ username }) => {
    try {
      const headers = process.env.GITHUB_TOKEN
        ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
        : {};

      const [profile, repos] = await Promise.all([
        axios.get(`https://api.github.com/users/${username}`, { headers }),
        axios.get(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
          { headers }
        ),
      ]);

      const languages = repos.data
        .map((r: any) => r.language)
        .filter(Boolean)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

      return {
        name: profile.data.name,
        bio: profile.data.bio,
        public_repos: profile.data.public_repos,
        followers: profile.data.followers,
        languages,
        top_repos: repos.data.slice(0, 5).map((r: any) => ({
          name: r.name,
          stars: r.stargazers_count,
          description: r.description,
          language: r.language,
        })),
      };
    } catch (err) {
      return { error: `GitHub profile not found or rate limited: ${username}` };
    }
  },
});