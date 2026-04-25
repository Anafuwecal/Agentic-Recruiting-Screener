import { VoltAgent } from '@voltagent/core';
import { HonoServer } from '@voltagent/server-hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createGroq } from '@ai-sdk/groq';

import { createIntakeAgent } from './agents/intakeAgent.js';
import { createResearcherAgent } from './agents/researcherAgent.js';
import { createScreenerAgent } from './agents/screenerAgent.js';
import { createJudgeAgent } from './agents/judgeAgent.js';
import { createCoordinatorAgent } from './agents/coordinatorAgent.js';

import { createWebhookRoutes } from './api/webhookRoutes.js';
import { createChatRoutes } from './api/chatRoutes.js';
import { createCandidateRoutes } from './api/candidateRoutes.js';
import { createConfigRoutes } from './api/configRoutes.js';

import { initWebSocket } from './services/websocket.js';
import { prisma } from './services/database.js';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const agents = {
  intake: createIntakeAgent(groq),
  researcher: createResearcherAgent(groq),
  screener: createScreenerAgent(groq),
  judge: createJudgeAgent(groq),
  coordinator: createCoordinatorAgent(groq),
};

const app = new Hono();

app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.get('/', (c) => c.text('AI Recruitment Screener Online'));

app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return c.json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: err.message 
    }, 500);
  }
});

app.route('/webhook', createWebhookRoutes(agents));
app.route('/api/chat', createChatRoutes(groq, agents));
app.route('/api/candidates', createCandidateRoutes());
app.route('/api/config', createConfigRoutes());

initWebSocket(3142);

async function seedDefaultJob() {
  try {
    const existing = await prisma.jobRequirement.findFirst({
      where: { isActive: true },
    });

    if (!existing) {
      await prisma.jobRequirement.create({
        data: {
          title: 'AI/Fullstack Engineer',
          requiredSkills: ['TypeScript', 'Node.js', 'React', 'AI/LLM'],
          niceToHave: ['VoltAgent', 'LangGraph', 'Python', 'Docker'],
          minimumExperienceYears: 2,
          portfolioRequired: true,
          githubRequired: false,
          isActive: true,
        },
      });
      console.log('[DB] Seeded default job requirement');
    }

    const webhookConfig = await prisma.webhookConfig.findFirst({
      where: { isActive: true },
    });

    if (!webhookConfig) {
      await prisma.webhookConfig.create({
        data: {
          endpoint: '/webhook/email',
          isActive: true,
        },
      });
      console.log('[DB] Seeded default webhook config');
    }
  } catch (err: any) {
    console.error('[DB] Seeding error:', err.message);
  }
}

seedDefaultJob();

new VoltAgent({
  agents,
  server: new HonoServer({
    app,
    port: parseInt(process.env.PORT || '3141'),
  }),
});

console.log(`Server running on port ${process.env.PORT || 3141}`);
console.log(`WebSocket running on port 3142`);
console.log(`Database: ${process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon' : 'Local'}`);