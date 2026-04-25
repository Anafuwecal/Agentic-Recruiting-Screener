import { Hono } from 'hono';
import {
  getActiveJobRequirement,
  deactivateAllJobRequirements,
  createJobRequirement,
  getActiveWebhookConfig,
  createOrUpdateWebhookConfig,
} from '../database/queries.js';

export function createConfigRoutes() {
  const app = new Hono();

  app.get('/job', async (c) => {
    try {
      const job = await getActiveJobRequirement();
      return c.json({ job });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch job' }, 500);
    }
  });

  app.put('/job', async (c) => {
    try {
      const data = await c.req.json();
      
      await deactivateAllJobRequirements();
      const job = await createJobRequirement({
        ...data,
        isActive: true,
      });

      return c.json({ job });
    } catch (err: any) {
      return c.json({ error: 'Failed to update job' }, 500);
    }
  });

  app.get('/webhook', async (c) => {
    try {
      const config = await getActiveWebhookConfig();
      return c.json({ config });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch webhook config' }, 500);
    }
  });

  app.put('/webhook', async (c) => {
    try {
      const data = await c.req.json();
      const config = await createOrUpdateWebhookConfig(data);
      return c.json({ config });
    } catch (err: any) {
      return c.json({ error: 'Failed to update webhook' }, 500);
    }
  });

  return app;
}