import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

export interface Candidate {
  _id?: Id<"candidates">;
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
  job_id: Id<"jobs">;
}

export interface JobRequirement {
  _id?: Id<"jobs">;
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
  metadata?: any;
}

export const convexDb = {
  // Candidates
  async createCandidate(candidate: Omit<Candidate, '_id'>) {
    return await client.mutation(api.candidates.create, candidate);
  },

  async updateCandidate(id: Id<"candidates">, updates: Partial<Candidate>) {
    return await client.mutation(api.candidates.update, { id, ...updates });
  },

  async getCandidate(id: Id<"candidates">) {
    return await client.query(api.candidates.get, { id });
  },

  async getCandidateByEmail(email: string) {
    return await client.query(api.candidates.getByEmail, { email });
  },

  async listCandidates(jobId?: Id<"jobs">, status?: string) {
    return await client.query(api.candidates.list, { jobId, status });
  },

  // Jobs
  async createJob(job: Omit<JobRequirement, '_id'>) {
    return await client.mutation(api.jobs.create, job);
  },

  async updateJob(id: Id<"jobs">, updates: Partial<JobRequirement>) {
    return await client.mutation(api.jobs.update, { id, ...updates });
  },

  async getActiveJob() {
    return await client.query(api.jobs.getActive);
  },

  async getJob(id: Id<"jobs">) {
    return await client.query(api.jobs.get, { id });
  },

  async listJobs() {
    return await client.query(api.jobs.list);
  },

  // Chat
  async saveChatMessage(message: ChatMessage) {
    return await client.mutation(api.chats.create, message);
  },

  async getChatHistory(limit = 50) {
    return await client.query(api.chats.list, { limit });
  },
};