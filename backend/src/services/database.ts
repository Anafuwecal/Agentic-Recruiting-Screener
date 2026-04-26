import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const CANDIDATES_COLLECTION = process.env.APPWRITE_CANDIDATES_COLLECTION_ID!;
const JOBS_COLLECTION = process.env.APPWRITE_JOBS_COLLECTION_ID!;
const CHATS_COLLECTION = process.env.APPWRITE_CHATS_COLLECTION_ID!;

export interface Candidate {
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
  
  // Scores
  intake_score: number;
  research_score: number;
  screener_score: number;
  total_score: number;
  
  // Status
  status: 'NEW' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'HUMAN_REVIEW';
  current_stage: string;
  decision?: string;
  rejection_reason?: string;
  
  // Interview Details
  interview_scheduled?: boolean;
  interview_datetime?: string;
  interview_meet_link?: string;
  interview_event_link?: string;
  
  // Metadata
  application_date: string;
  processed_date?: string;
  job_id: string;
}

export interface JobRequirement {
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
    return await databases.createDocument(
      DB_ID,
      CANDIDATES_COLLECTION,
      ID.unique(),
      candidate
    );
  },

  async updateCandidate(candidateId: string, updates: Partial<Candidate>) {
    return await databases.updateDocument(
      DB_ID,
      CANDIDATES_COLLECTION,
      candidateId,
      updates
    );
  },

  async getCandidate(candidateId: string) {
    return await databases.getDocument(DB_ID, CANDIDATES_COLLECTION, candidateId);
  },

  async getCandidateByEmail(email: string) {
    const response = await databases.listDocuments(DB_ID, CANDIDATES_COLLECTION, [
      Query.equal('email', email),
      Query.limit(1)
    ]);
    return response.documents[0] || null;
  },

  async listCandidates(jobId?: string, status?: string, limit = 100) {
    const queries = [Query.limit(limit), Query.orderDesc('application_date')];
    if (jobId) queries.push(Query.equal('job_id', jobId));
    if (status) queries.push(Query.equal('status', status));
    
    const response = await databases.listDocuments(DB_ID, CANDIDATES_COLLECTION, queries);
    return response.documents;
  },

  // Jobs
  async createJob(job: Omit<JobRequirement, '$id'>) {
    return await databases.createDocument(
      DB_ID,
      JOBS_COLLECTION,
      ID.unique(),
      job
    );
  },

  async updateJob(jobId: string, updates: Partial<JobRequirement>) {
    return await databases.updateDocument(
      DB_ID,
      JOBS_COLLECTION,
      jobId,
      updates
    );
  },

  async getActiveJob() {
    const response = await databases.listDocuments(DB_ID, JOBS_COLLECTION, [
      Query.equal('is_active', true),
      Query.limit(1)
    ]);
    return response.documents[0] || null;
  },

  async getJob(jobId: string) {
    return await databases.getDocument(DB_ID, JOBS_COLLECTION, jobId);
  },

  async listJobs() {
    const response = await databases.listDocuments(DB_ID, JOBS_COLLECTION, [
      Query.orderDesc('created_date')
    ]);
    return response.documents;
  },

  // Chat
  async saveChatMessage(message: ChatMessage) {
    return await databases.createDocument(
      DB_ID,
      CHATS_COLLECTION,
      ID.unique(),
      message
    );
  },

  async getChatHistory(limit = 50) {
    const response = await databases.listDocuments(DB_ID, CHATS_COLLECTION, [
      Query.orderDesc('timestamp'),
      Query.limit(limit)
    ]);
    return response.documents.reverse();
  }
};