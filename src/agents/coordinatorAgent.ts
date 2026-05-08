import { VoltAgent, Agent } from "@voltagent/core";
import { groq } from "@ai-sdk/groq"; // Import the Groq provider
import { scheduleInterviewTool } from "../tools/calendarTool";

export const coordinatorAgent = new Agent({
  name: "CoordinatorAgent",
  model: groq("llama-3.1-70b-versatile"),
  instructions: `You are an interview scheduler.

RULES:
- Interview must be 3-5 days from today
- 30-minute duration
- Use schedule_interview tool to create Google Meet event

Return JSON:
{
  "scheduled_time": "ISO timestamp",
  "meeting_link": "Google Meet URL",
  "calendar_event_id": "event ID",
  "event_link": "Calendar link"
}`,
  tools: [scheduleInterviewTool],
});