import { google, calendar_v3 } from "googleapis"; 
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? null,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export async function createMeetInterview(candidateName: string, candidateEmail: string) {
  // Calculate exactly 2 business days from now
  const startDate = new Date();
  let addedDays = 0;
  while (addedDays < 2) {
    startDate.setDate(startDate.getDate() + 1);
    if (startDate.getDay() !== 0 && startDate.getDay() !== 6) addedDays++;
  }
  
  // Interview lasts 1 hour
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  // Explicitly type the event object and safely default undefined values to null
  const event: calendar_v3.Schema$Event = {
    summary: `Technical Interview: ${candidateName}`,
    description: `Automated technical screening follow-up for ${candidateName}.`,
    start: { dateTime: startDate.toISOString(), timeZone: "UTC" },
    end: { dateTime: endDate.toISOString(), timeZone: "UTC" },
    attendees: [
      { email: candidateEmail ?? null }, 
      { email: process.env.RECRUITER_EMAIL ?? null }
    ],
    conferenceData: {
      createRequest: {
        requestId: `meet_${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1, // Crucial for Meet link generation
      requestBody: event,
    });
    return {
      meetLink: response.data.hangoutLink,
      scheduledTime: startDate.toISOString(),
    };
  } catch (error) {
    console.error(" Google Calendar API Error:", error);
    throw new Error("Failed to generate meeting link");
  }
}
