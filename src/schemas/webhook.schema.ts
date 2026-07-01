import { z } from "zod";

export const IncomingApplicationSchema = z.object({
  senderEmail: z.string().email("Invalid applicant email format"),
  senderName: z.string().min(2, "Applicant name must be at least 2 characters"),
  subject: z.string().min(1, "Email subject line cannot be empty"),
  emailBody: z.string().min(10, "Email body must contain sufficient data"),
  cvText: z.string().min(20, "CV content is required for structural parsing"),
  githubUrl: z.string().url("Invalid GitHub URL format").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Invalid Portfolio URL format").optional().or(z.literal("")),
});

export type IncomingApplicationInput = z.infer<typeof IncomingApplicationSchema>;