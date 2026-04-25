import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default job requirement
  const job = await prisma.jobRequirement.upsert({
    where: { id: 'default-job' },
    update: {},
    create: {
      id: 'default-job',
      title: 'AI/Fullstack Engineer',
      requiredSkills: ['TypeScript', 'Node.js', 'React', 'AI/LLM'],
      niceToHave: ['VoltAgent', 'LangGraph', 'Python', 'Docker'],
      minimumExperienceYears: 2,
      portfolioRequired: true,
      githubRequired: false,
      isActive: true,
    },
  });

  console.log('Created job requirement:', job);

  // Create default webhook config
  const webhook = await prisma.webhookConfig.upsert({
    where: { id: 'default-webhook' },
    update: {},
    create: {
      id: 'default-webhook',
      endpoint: '/webhook/email',
      isActive: true,
    },
  });

  console.log('Created webhook config:', webhook);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });