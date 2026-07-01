import { GraphStateType } from "../state.ts";

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
  
  // In a real production environment, you would use:
  // import { google } from 'googleapis';
  // const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  // const event = await calendar.events.insert({...});

  const mockGoogleCalendarResponse = {
    scheduledTime: interviewDate.toISOString(),
    meetLink: `https://meet.google.com/mock-${Math.random().toString(36).substring(7)}`,
    eventId: `evt_${Date.now()}`
  };

  console.log(`[LOGISTICS AGENT]: Meeting scheduled for ${interviewDate.toDateString()} at ${mockGoogleCalendarResponse.meetLink}`);

  return {
    logistics: {
      interviewDate: mockGoogleCalendarResponse.scheduledTime,
      meetLink: mockGoogleCalendarResponse.meetLink,
    },
    pipelineStatus: "LOGISTICS_COMPLETED",
  };
}