import { convexDb } from './convex-database';

// Re-export Convex as default db
export const db = convexDb;

// Re-export types
export type { Candidate, JobRequirement, ChatMessage } from './convex-database';