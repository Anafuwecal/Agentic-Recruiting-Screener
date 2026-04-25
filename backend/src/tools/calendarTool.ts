import { createTool } from '@voltagent/core';
import { google } from 'googleapis';
import { z } from 'zod';
import { addDays, setHours, setMinutes, isWithinInterval, addMinutes } from 'date-fns';

const getAuth = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return auth;
};

export const calendarTool = createTool({
  name: 'schedule_interview',
  description: 'Finds free 30-min slot in next 7 days and creates Google Meet.',
  parameters: z.object({
    candidate_email: z.string(),
    candidate_name: z.string(),
  }),
  execute: async ({ candidate_email, candidate_name }) => {
    try {
      const auth = getAuth();
      const calendar = google.calendar({
        version: 'v3',
        auth: (await auth.getClient()) as any,
      });

      const now = new Date();
      const in7Days = addDays(now, 7);

      const busyRes = await calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: in7Days.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      const busySlots = busyRes.data.calendars?.primary?.busy || [];

      let chosenStart: Date | null = null;
      let candidate = new Date(now);
      candidate.setMinutes(0, 0, 0);
      
      if (candidate.getHours() < 9) {
        candidate = setHours(candidate, 9);
      }

      while (candidate < in7Days && !chosenStart) {
        const hour = candidate.getHours();
        const day = candidate.getDay();

        if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
          const slotEnd = addMinutes(candidate, 30);
          const isBusy = busySlots.some((b: any) => {
            const s = new Date(b.start!);
            const e = new Date(b.end!);
            return candidate < e && slotEnd > s;
          });
          if (!isBusy) {
            chosenStart = new Date(candidate);
          }
        }
        candidate = addMinutes(candidate, 30);
      }

      if (!chosenStart) {
        return {
          status: 'FAILED',
          error: 'No available slot in the next 7 days.',
        };
      }

      const chosenEnd = addMinutes(chosenStart, 30);

      const event = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Interview: ${candidate_name}`,
          description: `Technical interview with ${candidate_name} (${candidate_email})`,
          start: { dateTime: chosenStart.toISOString() },
          end: { dateTime: chosenEnd.toISOString() },
          attendees: [{ email: candidate_email }],
          conferenceData: {
            createRequest: { requestId: `interview-${Date.now()}` },
          },
        },
      });

      return {
        status: 'SUCCESS',
        event_link: event.data.htmlLink,
        meet_link: event.data.conferenceData?.entryPoints?.[0]?.uri,
        scheduled_at: chosenStart.toISOString(),
        candidate_email,
        candidate_name,
        error: null,
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        error: err.message || 'Calendar scheduling failed',
      };
    }
  },
});