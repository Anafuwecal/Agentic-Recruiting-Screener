import { GraphStateType } from "../state.ts";
import { createMeetInterview } from "../../services/calendar.service.ts";

// Utility to calculate 2 business days from now
function getInterviewDate(): Date {
  const date = new Date();
  let addedDays = 0;
  while (addedDays < 2) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip Sunday (0) and Saturday (6)
      addedDays++;
    }
  }
  return date;
}

export async function logisticsNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[LOGISTICS AGENT]: Candidate passed. Provisioning Google Calendar event...");

  const interviewDate = getInterviewDate();
  
  const logisticsResult = await createMeetInterview(
    state.candidateInfo!.name, 
    state.candidateInfo!.email
  );

//  const mockGoogleCalendarResponse = {
//    scheduledTime: interviewDate.toISOString(),
//    meetLink: `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`,
//    eventId: `evt_${Date.now()}`
// };

  console.log(`[LOGISTICS AGENT]: Meeting scheduled for ${interviewDate.toDateString()} at ${logisticsResult.meetLink}`);

  return {
    logistics: {
      interviewDate: logisticsResult.scheduledTime,
      meetLink: logisticsResult.meetLink,
    },
    pipelineStatus: "LOGISTICS_COMPLETED",
  };
}