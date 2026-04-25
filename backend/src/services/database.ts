import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// -----------------------------
// Neon WebSocket Configuration
// -----------------------------
neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;

// -----------------------------
// Environment Setup
// -----------------------------
const connectionString =
  process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set');
}

// -----------------------------
// Prisma Initialization
// -----------------------------
function initPrisma(): PrismaClient {
  const isNeon = connectionString.includes('neon.tech');
  const useNeon =
    isNeon &&
    (process.env.NODE_ENV === 'production' ||
      process.env.USE_NEON_ADAPTER === 'true');

  if (useNeon) {
    console.log('[DB] Using Neon adapter');

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaNeon(pool);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  }

  console.log('[DB] Using standard Prisma driver');

  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
}

export const prisma = initPrisma();

// -----------------------------
// Connection Test
// -----------------------------
prisma
  .$connect()
  .then(() => console.log('[DB] Connected'))
  .catch((err) =>
    console.error('[DB] Connection failed:', err.message)
  );

// -----------------------------
// Graceful Shutdown
// -----------------------------
async function shutdown() {
  console.log('[DB] Disconnecting...');
  await prisma.$disconnect();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// -----------------------------
// DB HELPERS
// -----------------------------

export async function getActiveJobRequirement() {
  return prisma.jobRequirement.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createOrUpdateCandidate(data: any) {
  return prisma.candidate.upsert({
    where: { email: data.email },
    update: data,
    create: data,
  });
}

export async function createApplication(
  candidateId: string,
  data: any
) {
  return prisma.application.create({
    data: {
      candidateId,
      ...data,
    },
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  data: any = {}
) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status, ...data },
  });
}

export async function recordScore(
  candidateId: string,
  stage: string,
  score: number,
  maxScore: number,
  breakdown: any,
  reasoning?: string
) {
  return prisma.score.create({
    data: {
      candidateId,
      stage,
      score,
      maxScore,
      breakdown,
      reasoning,
    },
  });
}

export async function logAudit(
  candidateId: string | null,
  stage: string,
  action: string,
  reasoning: string,
  decision?: string,
  metadata?: any
) {
  return prisma.auditLog.create({
    data: {
      candidateId,
      stage,
      action,
      reasoning,
      decision,
      metadata,
    },
  });
}

export async function saveChatMessage(
  role: string,
  content: string,
  metadata?: any
) {
  return prisma.chatMessage.create({
    data: { role, content, metadata },
  });
}