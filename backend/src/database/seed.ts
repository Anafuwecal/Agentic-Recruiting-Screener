import { pool } from './connection.js';
import { createJobRequirement, createOrUpdateWebhookConfig } from './queries.js';

async function seed() {
  console.log('[SEED] Starting database seed...');

  try {
    // Create default job requirement
    await createJobRequirement({
      title: 'AI/Fullstack Engineer',
      requiredSkills: ['TypeScript', 'Node.js', 'React', 'AI/LLM'],
      niceToHave: ['VoltAgent', 'LangGraph', 'Python', 'Docker'],
      minimumExperienceYears: 2,
      portfolioRequired: true,
      githubRequired: false,
      isActive: true,
    });
    console.log('[SEED] Created default job requirement');

    // Create default webhook config
    await createOrUpdateWebhookConfig({
      endpoint: '/webhook/email',
    });
    console.log('[SEED] Created default webhook config');

    console.log('[SEED] Seeding complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('[SEED] Error:', error.message);
    process.exit(1);
  }
}

seed();