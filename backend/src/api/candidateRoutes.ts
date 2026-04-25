import { Hono } from 'hono';
import { prisma } from '../services/database';

export function createCandidateRoutes() {
  const app = new Hono();

  app.get('/', async (c) => {
    try {
      const candidates = await prisma.candidate.findMany({
        include: {
          applications: true,
          scores: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return c.json({ candidates });
    } catch (err) {
      return c.json({ error: 'Failed to fetch candidates' }, 500);
    }
  });

  app.get('/:id', async (c) => {
    try {
      const { id } = c.req.param();
      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
          applications: true,
          scores: true,
          auditLogs: true,
        },
      });
      return c.json({ candidate });
    } catch (err) {
      return c.json({ error: 'Failed to fetch candidate' }, 500);
    }
  });

  return app;
}