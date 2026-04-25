import { Hono } from 'hono';
import { getAllCandidates, getCandidateById } from '../database/queries.js';

export function createCandidateRoutes() {
  const app = new Hono();

  app.get('/', async (c) => {
    try {
      const candidates = await getAllCandidates();
      return c.json({ candidates });
    } catch (err: any) {
      console.error('[API] Error fetching candidates:', err);
      return c.json({ error: 'Failed to fetch candidates' }, 500);
    }
  });

  app.get('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const candidate = await getCandidateById(id);
      
      if (!candidate) {
        return c.json({ error: 'Candidate not found' }, 404);
      }
      
      return c.json({ candidate });
    } catch (err: any) {
      console.error('[API] Error fetching candidate:', err);
      return c.json({ error: 'Failed to fetch candidate' }, 500);
    }
  });

  return app;
}