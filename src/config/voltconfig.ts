import { VoltAgent } from '@voltmesh/voltagent';

export const voltConfig = {
  llm: {
    provider: 'openai-compatible',
    baseURL: process.env.GROK_API_URL,
    apiKey: process.env.GROK_API_KEY,
    model: 'llama-3.1-70b-versatile', // or your Grok model
    temperature: 0.3,
  },
  agents: {
    orchestrator: {
      name: 'Orchestrator',
      role: 'Central Controller & Decision Maker',
      temperature: 0.2,
    },
    intake: {
      name: 'Intake Agent',
      role: 'Email Parser & Data Extractor',
      temperature: 0.1,
    },
    researcher: {
      name: 'Researcher Agent',
      role: 'Verification & Validation Specialist',
      temperature: 0.3,
    },
    screener: {
      name: 'Screener Agent',
      role: 'Technical Assessment Expert',
      temperature: 0.4,
    },
    judge: {
      name: 'Judge Agent',
      role: 'Final Decision Authority',
      temperature: 0.2,
    },
    coordinator: {
      name: 'Coordinator Agent',
      role: 'Interview Scheduling Specialist',
      temperature: 0.1,
    },
  },
};