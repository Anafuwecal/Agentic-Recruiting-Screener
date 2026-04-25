import { Hono } from 'hono';
import { handleEmployerChatMessage } from '../services/orchestrator';
import { prisma } from '../services/database';

export function createChatRoutes(llm: any, agents: any) {
  const app = new Hono();

  app.post('/message', async (c) => {
    try {
      const { message } = await c.req.json();
      const response = await handleEmployerChatMessage(message, llm, agents);
      return c.json({ response });
    } catch (err) {
      console.error('[CHAT] Error:', err);
      return c.json({ error: 'Chat error' }, 500);
    }
  });

  app.get('/history', async (c) => {
    try {
      const messages = await prisma.chatMessage.findMany({
        orderBy: { timestamp: 'asc' },
        take: 100,
      });
      return c.json({ messages });
    } catch (err) {
      return c.json({ error: 'Failed to load history' }, 500);
    }
  });

  return app;
}