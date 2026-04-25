import { Hono } from 'hono';
import { handleEmployerChatMessage } from '../services/orchestrator.js';
import { getChatHistory } from '../database/queries.js';

export function createChatRoutes(llm: any, agents: any) {
  const app = new Hono();

  app.post('/message', async (c) => {
    try {
      const { message } = await c.req.json();
      const response = await handleEmployerChatMessage(message, llm, agents);
      return c.json({ response });
    } catch (err: any) {
      console.error('[CHAT] Error:', err);
      return c.json({ error: 'Chat error' }, 500);
    }
  });

  app.get('/history', async (c) => {
    try {
      const messages = await getChatHistory(100);
      return c.json({ messages });
    } catch (err: any) {
      return c.json({ error: 'Failed to load history' }, 500);
    }
  });

  return app;
}