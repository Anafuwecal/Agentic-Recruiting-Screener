import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 
                (import.meta.env.PROD 
                  ? 'https://agentic-recruiting-screener.onrender.com' 
                  : 'http://localhost:3141');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Candidate {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  github_url?: string;
  portfolio_url?: string;
  skills: string[];
  experience_years: number;
  intake_score: number;
  research_score: number;
  screener_score: number;
  total_score: number;
  status: string;
  current_stage: string;
  decision?: string;
  rejection_reason?: string;
  interview_scheduled?: boolean;
  interview_datetime?: string;
  interview_meet_link?: string;
  application_date: string;
}

export interface Job {
  $id: string;
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
}

export const apiService = {
  // Chat
  async sendMessage(message: string) {
    const res = await api.post('/api/chat', { message });
    return res.data.response;
  },

  async getChatHistory() {
    const res = await api.get('/api/chat/history');
    return res.data.history as ChatMessage[];
  },

  // Candidates
  async getCandidates(status?: string) {
    const res = await api.get('/api/candidates', { params: { status } });
    return res.data.candidates as Candidate[];
  },

  async getCandidate(id: string) {
    const res = await api.get(`/api/candidates/${id}`);
    return res.data.candidate as Candidate;
  },

  // Jobs
  async getJobs() {
    const res = await api.get('/api/jobs');
    return res.data.jobs as Job[];
  },

  async getActiveJob() {
    const res = await api.get('/api/jobs/active');
    return res.data.job as Job;
  },

  async createJob(job: Omit<Job, '$id' | 'created_date'>) {
    const res = await api.post('/api/jobs', job);
    return res.data.job as Job;
  },

  async updateJob(id: string, updates: Partial<Job>) {
    const res = await api.put(`/api/jobs/${id}`, updates);
    return res.data.job as Job;
  },

  // Stats
  async getStats() {
    const res = await api.get('/api/stats');
    return res.data.stats;
  },
};