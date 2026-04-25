import { Hono } from 'hono';
import { prisma } from '../services/database';

export function createConfigRoutes() {
  const app = new Hono();

  app.get('/job', async (c) => {
    try {
      const job = await prisma.jobRequirement.findFirst({
        where: { isActive: true },
      });
      return c.json({ job });
    } catch (err) {
      return c.json({ error: 'Failed to fetch job' }, 500);
    }
  });

  app.put('/job', async (c) => {
    try {
      const data = await c.req.json();
      
      await prisma.jobRequirement.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const job = await prisma.jobRequirement.create({
        data: {
          ...data,
          isActive: true,
        },
      });

      return c.json({ job });
    } catch (err) {
      return c.json({ error: 'Failed to update job' }, 500);
    }
  });

  app.get('/webhook', async (c) => {
    try {
      const config = await prisma.webhookConfig.findFirst({
        where: { isActive: true },
      });
      return c.json({ config });
    } catch (err) {
      return c.json({ error: 'Failed to fetch webhook config' }, 500);
    }
  });

  app.put('/webhook', async (c) => {
    try {
      const data = await c.req.json();
      
      await prisma.webhookConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const config = await prisma.webhookConfig.create({
        data: {
          ...data,
          isActive: true,
        },
      });

      return c.json({ config });
    } catch (err) {
      return c.json({ error: 'Failed to update webhook' }, 500);
    }
  });

  return app;
}