import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error('ERROR: CONVEX_URL environment variable is not set!');
  console.error('Please create a .env file in the backend directory with:');
  console.error('CONVEX_URL=https://zany-sparrow-783.convex.cloud');
  throw new Error('CONVEX_URL environment variable is required');
}

console.log('✓ Connecting to Convex:', CONVEX_URL);

const client = new ConvexHttpClient(CONVEX_URL);

export interface Candidate {
  _id?: Id<"candidates">;
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
  _id?: Id<"jobs">;
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
  _id?: Id<"chats">;
  sender: 'EMPLOYER' | 'ORCHESTRATOR';
  message: string;
  timestamp: string;
  metadata?: any;
}

export const convexDb = {
  // Candidates
  async createCandidate(candidate: Omit<Candidate, '_id' | '$id'>) {
    try {
      const id = await client.mutation(api.candidates.create, {
        ...candidate,
        job_id: candidate.job_id as Id<"jobs">,
      });
      console.log('✓ Candidate created in Convex:', candidate.email);
      return { ...candidate, _id: id, $id: id };
    } catch (error) {
      console.error('Error creating candidate in Convex:', error);
      throw error;
    }
  },

  async updateCandidate(candidateId: string, updates: Partial<Candidate>) {
    try {
      const result = await client.mutation(api.candidates.update, {
        id: candidateId as Id<"candidates">,
        ...updates,
      });
      return { ...result, $id: result?._id };
    } catch (error) {
      console.error('Error updating candidate in Convex:', error);
      throw error;
    }
  },

  async getCandidate(candidateId: string) {
    try {
      const result = await client.query(api.candidates.get, {
        id: candidateId as Id<"candidates">,
      });
      return result ? { ...result, $id: result._id } : null;
    } catch (error) {
      console.error('Error getting candidate from Convex:', error);
      throw error;
    }
  },

  async getCandidateByEmail(email: string) {
    try {
      const result = await client.query(api.candidates.getByEmail, { email });
      return result ? { ...result, $id: result._id } : null;
    } catch (error) {
      console.error('Error getting candidate by email from Convex:', error);
      return null;
    }
  },

  async listCandidates(jobId?: string, status?: string) {
    try {
      const results = await client.query(api.candidates.list, {
        jobId: jobId as Id<"jobs"> | undefined,
        status,
      });
      return results.map(r => ({ ...r, $id: r._id }));
    } catch (error) {
      console.error('Error listing candidates from Convex:', error);
      return [];
    }
  },

  // Jobs
  async createJob(job: Omit<JobRequirement, '_id' | '$id'>) {
    try {
      const id = await client.mutation(api.jobs.create, job);
      console.log('✓ Job created in Convex:', job.title);
      return { ...job, _id: id, $id: id };
    } catch (error) {
      console.error('Error creating job in Convex:', error);
      throw error;
    }
  },

  async updateJob(jobId: string, updates: Partial<JobRequirement>) {
    try {
      const result = await client.mutation(api.jobs.update, {
        id: jobId as Id<"jobs">,
        ...updates,
      });
      return { ...result, $id: result?._id };
    } catch (error) {
      console.error('Error updating job in Convex:', error);
      throw error;
    }
  },

  async getActiveJob() {
    try {
      const result = await client.query(api.jobs.getActive);
      return result ? { ...result, $id: result._id } : null;
    } catch (error) {
      console.error('Error getting active job from Convex:', error);
      return null;
    }
  },

  async getJob(jobId: string) {
    try {
      const result = await client.query(api.jobs.get, {
        id: jobId as Id<"jobs">,
      });
      return result ? { ...result, $id: result._id } : null;
    } catch (error) {
      console.error('Error getting job from Convex:', error);
      throw error;
    }
  },

  async listJobs() {
    try {
      const results = await client.query(api.jobs.list);
      return results.map(r => ({ ...r, $id: r._id }));
    } catch (error) {
      console.error('Error listing jobs from Convex:', error);
      return [];
    }
  },

  // Chat
  async saveChatMessage(message: ChatMessage) {
    try {
      const id = await client.mutation(api.chats.create, message);
      return { ...message, _id: id };
    } catch (error) {
      console.error('Error saving chat message to Convex:', error);
      throw error;
    }
  },

  async getChatHistory(limit = 50) {
    try {
      return await client.query(api.chats.list, { limit });
    } catch (error) {
      console.error('Error getting chat history from Convex:', error);
      return [];
    }
  },
};