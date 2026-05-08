import { z } from "zod";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export const scheduleInterviewTool = {
  name: "schedule_interview",
  description: "Schedules a Google Meet interview",
  parameters: {
    type: "object",
    properties: {
      candidate_name: {
        type: "string",
        description: "Full name of the candidate",
      },
      candidate_email: {
        type: "string",
        format: "email",
        description: "Email address of the candidate",
      },
    },
    required: ["candidate_name", "candidate_email"],
  },
  execute: async ({
    candidate_name,
    candidate_email,
  }: {
    candidate_name: string;
    candidate_email: string;
  }) => {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration

      const event = {
        summary: `Interview with ${candidate_name}`,
        description: "Technical interview for recruitment",
        start: {
          dateTime: startDate.toISOString(),
          timeZone: "America/Los_Angeles",
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: "America/Los_Angeles",
        },
        attendees: [
          { email: candidate_email },
          { email: process.env.EMPLOYER_EMAIL },
        ],
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1,
      });

      return {
        scheduled_time: response.data.start?.dateTime,
        meeting_link: response.data.hangoutLink,
        calendar_event_id: response.data.id,
        event_link: response.data.htmlLink,
      };
    } catch (error: any) {
      return {
        error: error.message,
        scheduled_time: null,
        meeting_link: null,
      };
    }
  },
};