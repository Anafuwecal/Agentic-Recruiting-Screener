import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';

dotenv.config();

// Import Groq provider
import { createGroq } from '@ai-sdk/groq';

import { createIntakeAgent } from './agents/intakeAgent';
import { createResearcherAgent } from './agents/researcherAgent';
import { createScreenerAgent } from './agents/screenerAgent';
import { createJudgeAgent } from './agents/judgeAgent';
import { createCoordinatorAgent } from './agents/coordinatorAgent';
import { runPipeline } from './orchestrator';
import { handleEmployerMessage } from './chatHandler';
import { db } from './services/database';
import { JOB_REQUIREMENTS, updateJobRequirements } from './rubric';

// Initialize Groq LLM
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Create agents
const agents = {
  intake: createIntakeAgent(groq),
  researcher: createResearcherAgent(groq),
  screener: createScreenerAgent(groq),
  judge: createJudgeAgent(groq),
  coordinator: createCoordinatorAgent(groq),
};

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3141',
    'https://agentic-recruiting-screener.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ 
  status: 'online', 
  service: 'AI Recruitment Screener',
  version: '1.0.0'
}));

// Webhook endpoint for email applications
app.post('/webhook/email', async (c) => {
  try {
    const body = await c.req.json();
    const fromEmail = body?.from?.address || body?.from || 'unknown@unknown.com';
    const subject = body?.subject || 'Job Application';
    const textBody = body?.text || body?.html || '';

    console.log(`\nWebhook received from: ${fromEmail}`);

    const fullEmailText = `From: ${fromEmail}\nSubject: ${subject}\n---\n${textBody}`;

    // Get active job
    const activeJob = await db.getActiveJob();
    if (!activeJob) {
      console.error('No active job found');
      return c.json({ error: 'No active job posting' }, 400);
    }

    // Update job requirements
    updateJobRequirements({
      title: activeJob.title,
      required_skills: activeJob.required_skills,
      nice_to_have: activeJob.nice_to_have,
      minimum_experience_years: activeJob.minimum_experience_years,
      portfolio_required: activeJob.portfolio_required,
    });

    // Fire async pipeline (don't wait)
    runPipeline(fullEmailText, fromEmail, agents, activeJob.$id).catch((err) => {
      console.error('Pipeline error:', err);
    });

    return c.json({ received: true, status: 'processing' }, 200);
  } catch (err: any) {
    console.error('Webhook error:', err);
    return c.json({ error: 'Server error', details: err.message }, 500);
  }
});

// Chat endpoint
app.post('/api/chat', async (c) => {
  try {
    const { message } = await c.req.json();
    
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Invalid message' }, 400);
    }

    const response = await handleEmployerMessage(message);
    
    return c.json({ response });
  } catch (err: any) {
    console.error('Chat error:', err);
    return c.json({ error: 'Chat processing failed', details: err.message }, 500);
  }
});

// Get chat history
app.get('/api/chat/history', async (c) => {
  try {
    const history = await db.getChatHistory();
    return c.json({ history });
  } catch (err: any) {
    console.error('Chat history error:', err);
    return c.json({ error: 'Failed to load chat history', details: err.message }, 500);
  }
});

// Get candidates
app.get('/api/candidates', async (c) => {
  try {
    const status = c.req.query('status');
    const candidates = await db.listCandidates(undefined, status);
    return c.json({ candidates });
  } catch (err: any) {
    console.error('Candidates fetch error:', err);
    return c.json({ error: 'Failed to fetch candidates', details: err.message }, 500);
  }
});

// Get candidate by ID
app.get('/api/candidates/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const candidate = await db.getCandidate(id);
    return c.json({ candidate });
  } catch (err: any) {
    console.error('Candidate fetch error:', err);
    return c.json({ error: 'Candidate not found', details: err.message }, 404);
  }
});

// Get jobs
app.get('/api/jobs', async (c) => {
  try {
    const jobs = await db.listJobs();
    return c.json({ jobs });
  } catch (err: any) {
    console.error('Jobs fetch error:', err);
    return c.json({ error: 'Failed to fetch jobs', details: err.message }, 500);
  }
});

// Get active job
app.get('/api/jobs/active', async (c) => {
  try {
    const job = await db.getActiveJob();
    return c.json({ job });
  } catch (err: any) {
    console.error('Active job fetch error:', err);
    return c.json({ error: 'Failed to fetch active job', details: err.message }, 500);
  }
});

// Create job
app.post('/api/jobs', async (c) => {
  try {
    const jobData = await c.req.json();
    
    // Deactivate other jobs
    const existingJobs = await db.listJobs();
    for (const job of existingJobs) {
      if (job.is_active) {
        await db.updateJob(job.$id, { is_active: false });
      }
    }

    const job = await db.createJob({
      ...jobData,
      is_active: true,
      created_date: new Date().toISOString(),
    });

    return c.json({ job }, 201);
  } catch (err: any) {
    console.error('Job creation error:', err);
    return c.json({ error: 'Failed to create job', details: err.message }, 500);
  }
});

// Update job
app.put('/api/jobs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const job = await db.updateJob(id, updates);
    
    // Update in-memory requirements if this is active job
    const activeJob = await db.getActiveJob();
    if (activeJob && activeJob.$id === id) {
      updateJobRequirements({
        title: activeJob.title,
        required_skills: activeJob.required_skills,
        nice_to_have: activeJob.nice_to_have,
        minimum_experience_years: activeJob.minimum_experience_years,
        portfolio_required: activeJob.portfolio_required,
      });
    }
    
    return c.json({ job });
  } catch (err: any) {
    console.error('Job update error:', err);
    return c.json({ error: 'Failed to update job', details: err.message }, 500);
  }
});

// Slack interaction webhook (for approve/reject buttons)
app.post('/webhook/slack/interactive', async (c) => {
  try {
    const body = await c.req.parseBody();
    const payload = JSON.parse(body.payload as string);
    
    const action = payload.actions[0];
    const candidateId = action.value;
    const actionId = action.action_id;

    if (actionId === 'approve_candidate') {
      await db.updateCandidate(candidateId, {
        status: 'ACCEPTED',
        decision: 'PROCEED',
        current_stage: 'Approved via Slack',
      });
      
      return c.json({ 
        text: `Candidate approved. Please schedule interview via chat or UI.` 
      });
    } 
    else if (actionId === 'reject_candidate') {
      const candidate = await db.getCandidate(candidateId);
      
      await db.updateCandidate(candidateId, {
        status: 'REJECTED',
        decision: 'REJECT',
        rejection_reason: 'Rejected by employer via Slack',
        current_stage: 'Rejected via Slack',
      });

      // Send rejection email
      const { mailCandidate } = await import('./services/mailer');
      await mailCandidate(
        candidate.email,
        `Application Update - ${JOB_REQUIREMENTS.title}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Application Status Update</h2>
            <p>Dear ${candidate.name},</p>
            <p>Thank you for your interest in the ${JOB_REQUIREMENTS.title} position.</p>
            <p>After review, we have decided not to move forward at this time.</p>
            <p>We wish you the best in your job search.</p>
            <br>
            <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>
          </div>
        `
      );
      
      return c.json({ 
        text: `Candidate rejected. Rejection email sent.` 
      });
    }

    return c.json({ text: 'Action processed' });
  } catch (err: any) {
    console.error('Slack interaction error:', err);
    return c.json({ error: 'Failed to process action' }, 500);
  }
});

// Statistics endpoint
app.get('/api/stats', async (c) => {
  try {
    const candidates = await db.listCandidates();
    
    const stats = {
      total: candidates.length,
      new: candidates.filter((c: any) => c.status === 'NEW').length,
      processing: candidates.filter((c: any) => c.status === 'PROCESSING').length,
      accepted: candidates.filter((c: any) => c.status === 'ACCEPTED').length,
      rejected: candidates.filter((c: any) => c.status === 'REJECTED').length,
      human_review: candidates.filter((c: any) => c.status === 'HUMAN_REVIEW').length,
      interviewed: candidates.filter((c: any) => c.interview_scheduled).length,
    };
    
    return c.json({ stats });
  } catch (err: any) {
    console.error('Stats error:', err);
    return c.json({ error: 'Failed to fetch stats', details: err.message }, 500);
  }
});

// Start server
const PORT = parseInt(process.env.PORT || '3141');

console.log('\n' + '='.repeat(60));
console.log('  AI RECRUITMENT SCREENER - Starting...');
console.log('='.repeat(60));
console.log(`Server starting on http://localhost:${PORT}`);
console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/email`);
console.log(`Chat endpoint: http://localhost:${PORT}/api/chat`);
console.log('='.repeat(60) + '\n');

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✓ Server is running on http://localhost:${info.port}\n`);
});