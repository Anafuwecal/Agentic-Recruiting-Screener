import { createTool } from '@voltagent/core';
import axios from 'axios';
import { z } from 'zod';

export const googleSearchTool = createTool({
  name: 'google_search',
  description: 'Searches Google for professional presence of a person.',
  parameters: z.object({
    query: z.string().describe('Search query (e.g., "John Doe developer")'),
  }),
  execute: async ({ query }) => {
    try {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_CX;

      if (!apiKey || !cx) {
        return {
          success: false,
          error: 'Google Search API not configured',
        };
      }

      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1`,
        {
          params: {
            key: apiKey,
            cx: cx,
            q: query,
            num: 5,
          },
        }
      );

      const items = response.data.items || [];
      
      return {
        success: true,
        results: items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        })),
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Google Search failed',
        details: err.message,
      };
    }
  },
});