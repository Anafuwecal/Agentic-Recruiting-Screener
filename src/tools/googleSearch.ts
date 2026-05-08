import axios from 'axios';

export const googleSearch = {
  name: 'google_search',
  description: 'Searches Google for candidate verification',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
  execute: async ({ query }: { query: string }) => {
    try {
      const res = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: process.env.SERPAPI_KEY,
          q: query,
          num: 5,
          engine: 'google',
        },
      });

      return res.data.organic_results?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })) || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },
};