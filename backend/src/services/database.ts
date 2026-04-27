import { Client, Databases, ID, Query } from 'node-appwrite';

// Check if Appwrite is configured
const isAppwriteConfigured = Boolean(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_API_KEY
);

let databases: Databases | null = null;
let DB_ID = '';
let CANDIDATES_COLLECTION = '';
let JOBS_COLLECTION = '';
let CHATS_COLLECTION = '';

if (isAppwriteConfigured) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  databases = new Databases(client);
  DB_ID = process.env.APPWRITE_DATABASE_ID!;
  CANDIDATES_COLLECTION = process.env.APPWRITE_CANDIDATES_COLLECTION_ID!;
  JOBS_COLLECTION = process.env.APPWRITE_JOBS_COLLECTION_ID!;
  CHATS_COLLECTION = process.env.APPWRITE_CHATS_COLLECTION_ID!;

  console.log('Appwrite connected successfully');
} else {
  console.warn('⚠️  Appwrite not configured. Using in-memory storage (data will be lost on restart)');
}

// In-memory fallback storage
const memoryStorage = {
  candidates: new Map(),
  jobs: new Map(),
  chats: [] as any[],
};

export interface Candidate {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  github_url?: string;
  github_username?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  skills: string[];
  experience_years: number;
  education?: string;
  previous_roles?: string[];
  cover_letter_summary?: string;
  
  intake_score: number;
  research_score: number;
  screener_score: number;
  total_score: number;
  
  status: 'NEW' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'HUMAN_REVIEW';
  current_stage: string;
  decision?: string;
  rejection_reason?: string;
  
  interview_scheduled?: boolean;
  interview_datetime?: string;
  interview_meet_link?: string;
  interview_event_link?: string;
  
  application_date: string;
  processed_date?: string;
  job_id: string;
}

export interface JobRequirement {
  $id?: string;
  title: string;
  required_skills: string[];
  nice_to_have: string[];
  minimum_experience_years: number;
  portfolio_required: boolean;
  description?: string;
  is_active: boolean;
  created_date: string;
}

export interface ChatMessage {
  sender: 'EMPLOYER' | 'ORCHESTRATOR';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const db = {
  // Candidates
  async createCandidate(candidate: Omit<Candidate, '$id'>) {
    if (databases) {
      return await databases.createDocument(
        DB_ID,
        CANDIDATES_COLLECTION,
        ID.unique(),
        candidate
      );
    } else {
      const id = `candidate_${Date.now()}_${Math.random()}`;
      const doc = { $id: id, ...candidate };
      memoryStorage.candidates.set(id, doc);
      return doc;
    }
  },

  async updateCandidate(candidateId: string, updates: Partial<Candidate>) {
    if (databases) {
      return await databases.updateDocument(
        DB_ID,
        CANDIDATES_COLLECTION,
        candidateId,
        updates
      );
    } else {
      const existing = memoryStorage.candidates.get(candidateId);
      if (existing) {
        const updated = { ...existing, ...updates };
        memoryStorage.candidates.set(candidateId, updated);
        return updated;
      }
      throw new Error('Candidate not found');
    }
  },

  async getCandidate(candidateId: string) {
    if (databases) {
      return await databases.getDocument(DB_ID, CANDIDATES_COLLECTION, candidateId);
    } else {
      const candidate = memoryStorage.candidates.get(candidateId);
      if (!candidate) throw new Error('Candidate not found');
      return candidate;
    }
  },

  async getCandidateByEmail(email: string) {
    if (databases) {
      const response = await databases.listDocuments(DB_ID, CANDIDATES_COLLECTION, [
        Query.equal('email', email),
        Query.limit(1)
      ]);
      return response.documents[0] || null;
    } else {
      const candidates = Array.from(memoryStorage.candidates.values());
      return candidates.find((c: any) => c.email === email) || null;
    }
  },

  async listCandidates(jobId?: string, status?: string, limit = 100) {
    if (databases) {
      const queries = [Query.limit(limit), Query.orderDesc('application_date')];
      if (jobId) queries.push(Query.equal('job_id', jobId));
      if (status) queries.push(Query.equal('status', status));
      
      const response = await databases.listDocuments(DB_ID, CANDIDATES_COLLECTION, queries);
      return response.documents;
    } else {
      let candidates = Array.from(memoryStorage.candidates.values());
      if (jobId) candidates = candidates.filter((c: any) => c.job_id === jobId);
      if (status) candidates = candidates.filter((c: any) => c.status === status);
      return candidates.sort((a: any, b: any) => 
        new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
      ).slice(0, limit);
    }
  },

  // Jobs
  async createJob(job: Omit<JobRequirement, '$id'>) {
    if (databases) {
      return await databases.createDocument(
        DB_ID,
        JOBS_COLLECTION,
        ID.unique(),
        job
      );
    } else {
      const id = `job_${Date.now()}`;
      const doc = { $id: id, ...job };
      memoryStorage.jobs.set(id, doc);
      return doc;
    }
  },

  async updateJob(jobId: string, updates: Partial<JobRequirement>) {
    if (databases) {
      return await databases.updateDocument(
        DB_ID,
        JOBS_COLLECTION,
        jobId,
        updates
      );
    } else {
      const existing = memoryStorage.jobs.get(jobId);
      if (existing) {
        const updated = { ...existing, ...updates };
        memoryStorage.jobs.set(jobId, updated);
        return updated;
      }
      throw new Error('Job not found');
    }
  },

  async getActiveJob() {
    if (databases) {
      const response = await databases.listDocuments(DB_ID, JOBS_COLLECTION, [
        Query.equal('is_active', true),
        Query.limit(1)
      ]);
      return response.documents[0] || null;
    } else {
      const jobs = Array.from(memoryStorage.jobs.values());
      return jobs.find((j: any) => j.is_active) || null;
    }
  },

  async getJob(jobId: string) {
    if (databases) {
      return await databases.getDocument(DB_ID, JOBS_COLLECTION, jobId);
    } else {
      const job = memoryStorage.jobs.get(jobId);
      if (!job) throw new Error('Job not found');
      return job;
    }
  },

  async listJobs() {
    if (databases) {
      const response = await databases.listDocuments(DB_ID, JOBS_COLLECTION, [
        Query.orderDesc('created_date')
      ]);
      return response.documents;
    } else {
      return Array.from(memoryStorage.jobs.values()).sort((a: any, b: any) => 
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    }
  },

  // Chat
  async saveChatMessage(message: ChatMessage) {
    if (databases) {
      return await databases.createDocument(
        DB_ID,
        CHATS_COLLECTION,
        ID.unique(),
        message
      );
    } else {
      memoryStorage.chats.push(message);
      return message;
    }
  },

  async getChatHistory(limit = 50) {
    if (databases) {
      const response = await databases.listDocuments(DB_ID, CHATS_COLLECTION, [
        Query.orderDesc('timestamp'),
        Query.limit(limit)
      ]);
      return response.documents.reverse();
    } else {
      return memoryStorage.chats.slice(-limit);
    }
  }
};