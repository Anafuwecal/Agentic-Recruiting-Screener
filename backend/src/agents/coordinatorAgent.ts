import { Agent } from '@voltagent/core';
import { calendarTool } from '../tools/calendarTool';

export const createCoordinatorAgent = (llm: any) =>
  new Agent({
    name: 'Coordinator Agent',
    description: 'Schedules interviews when authorized by Orchestrator.',
    llm,
    model: 'llama-3.3-70b-versatile',
    tools: [calendarTool],
    instructions: `
      You handle interview scheduling ONLY when Orchestrator approves.
      
      When instructed:
      1. Use schedule_interview tool to find a free slot
      2. Create Google Meet event
      3. Return ALL details to Orchestrator (do NOT send emails yourself)
      
      Return:
      {
        "scheduled_at": string (ISO 8601 format),
        "meet_link": string,
        "event_link": string,
        "candidate_email": string,
        "candidate_name": string,
        "status": "SUCCESS" | "FAILED",
        "error": string | null
      }
      
      Always use current date/time. Never backdate.
    `,
  });