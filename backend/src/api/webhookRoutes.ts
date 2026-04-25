import { Hono } from 'hono';
import { runRecruitmentPipeline } from '../services/orchestrator';

export function createWebhookRoutes(agents: any) {
  const app = new Hono();

  app.post('/email', async (c) => {
    try {
      const body = await c.req.json();
      const fromEmail = body?.from?.address || body?.from || 'unknown@unknown.com';
      const subject = body?.subject || '';
      const textBody = body?.text || body?.html || '';

      const fullEmailText = `From: ${fromEmail}\nSubject: ${subject}\n---\n${textBody}`;

      runRecruitmentPipeline(fullEmailText, fromEmail, agents).catch(
        console.error
      );

      return c.json({ received: true }, 200);
    } catch (err) {
      console.error('[WEBHOOK] Error:', err);
      return c.json({ error: 'Server error' }, 500);
    }
  });

  return app;
}