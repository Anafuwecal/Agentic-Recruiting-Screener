import { createTool } from '@voltagent/core';
import axios from 'axios';
import { z } from 'zod';

export const googleSearchTool = createTool({
  name: 'google_search',
  description: 'Searches Google for professional presence verification.',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            key: process.env.GOOGLE_SEARCH_API_KEY,
            cx: process.env.GOOGLE_SEARCH_CX,
            q: query,
            num: 5,
          },
        }
      );

      return {
        results: response.data.items?.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        })) || [],
      };
    } catch (err) {
      return { error: 'Google Search failed or quota exceeded' };
    }
  },
});