import { Agent } from '@voltagent/core';
import { calendarTool } from '../tools/calendarTool';

export const createCoordinatorAgent = (llm: any) =>
  new Agent({
    name: 'Coordinator Agent',
    llm,
    model: 'llama-3.3-70b-versatile',
    tools: [calendarTool],
    instructions: `
      You handle interview scheduling ONLY when the Orchestrator approves.
      
      When instructed to schedule:
      1. Use schedule_interview tool with candidate details
      2. Return ALL scheduling details to Orchestrator
      3. NEVER send emails directly - Orchestrator handles all communication
      
      Return ONLY valid JSON:
      {
        "scheduled_at": string,
        "formatted_time": string,
        "meet_link": string,
        "event_link": string,
        "candidate_email": string,
        "candidate_name": string,
        "success": boolean,
        "error": string | null
      }
      
      If scheduling fails, set success: false and provide error message.
    `,
  });