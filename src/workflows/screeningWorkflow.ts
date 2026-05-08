import { createWorkflowChain } from "@voltagent/core";
import { z } from "zod";
import { intakeAgent } from "../agents/intakeAgent";
import { researcherAgent } from "../agents/researcherAgent";
import { screenerAgent } from "../agents/screenerAgent";
import { judgeAgent } from "../agents/judgeAgent";
import { coordinatorAgent } from "../agents/coordinatorAgent";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

export const screeningWorkflow = createWorkflowChain({
  id: "recruitment-screening",
  input: z.object({
    email_content: z.string(),
    attachment_text: z.string().optional(),
  }),
  result: z.object({
    decision: z.enum(["PROCEED", "REJECT", "HUMAN_REVIEW"]),
    candidate_email: z.string().email(),
    total_score: z.number(),
    summary: z.string(),
  }),
})
  // STAGE 1: INTAKE
  .andThen({
    id: "intake-parsing",
    execute: async ({ data }) => {
      console.log("🔹 STAGE 1: Intake Agent");

      const fullContent = data.attachment_text
        ? `EMAIL:\n${data.email_content}\n\nRESUME/CV:\n${data.attachment_text}`
        : data.email_content;

      const result = await intakeAgent.execute({
        input: `Parse this application:\n\n${fullContent}`,
      });

      const parsed = JSON.parse(result);

      // Create applicant in Convex
      const applicantId = await convex.mutation(api.applicants.create, {
        name: parsed.extracted_data?.name || "Unknown",
        email: parsed.extracted_data?.email || "no-email@unknown.com",
        rawEmail: data.email_content,
      });

      // Store intake data
      await convex.mutation(api.applicants.updateAgentData, {
        id: applicantId,
        category: "intake",
        data: parsed,
      });

      await convex.mutation(api.applicants.updateScore, {
        id: applicantId,
        category: "intake",
        score: parsed.intake_score,
      });

      return {
        applicantId,
        intakeResult: parsed,
        candidateEmail: parsed.extracted_data?.email,
      };
    },
  })

  // STAGE 2: EARLY REJECTION CHECK
  .andThen({
    id: "early-rejection-check",
    execute: async ({ data }) => {
      const { intakeResult, applicantId, candidateEmail } = data;

      if (intakeResult.immediate_rejection) {
        console.log("❌ IMMEDIATE REJECTION:", intakeResult.rejection_reason);

        await convex.mutation(api.applicants.updateStatus, {
          id: applicantId,
          status: "REJECTED",
          stage: "early_rejection",
        });

        // Send rejection emails (handled by orchestrator)
        return {
          early_reject: true,
          reason: intakeResult.rejection_reason,
          candidateEmail,
          applicantId,
        };
      }

      return {
        early_reject: false,
        intakeResult,
        applicantId,
        candidateEmail,
      };
    },
  })

  // STAGE 3: RESEARCH (if not rejected)
  .andThen({
    id: "research-verification",
    execute: async ({ data }) => {
      if (data.early_reject) {
        return data; // Skip research if already rejected
      }

      console.log("🔹 STAGE 2: Researcher Agent");

      const candidateData = data.intakeResult.extracted_data;

      const researchInput = `
Verify this candidate:

CANDIDATE CLAIMS:
${JSON.stringify(candidateData, null, 2)}

Use your tools to analyze GitHub and portfolio.
      `;

      const researchResult = await researcherAgent.execute({
        input: researchInput,
      });

      const parsed = JSON.parse(researchResult);

      await convex.mutation(api.applicants.updateAgentData, {
        id: data.applicantId,
        category: "research",
        data: parsed,
      });

      await convex.mutation(api.applicants.updateScore, {
        id: data.applicantId,
        category: "research",
        score: parsed.verification_score,
      });

      // Check for research-based rejection
      if (!parsed.is_authentic || parsed.confidence === "low") {
        await convex.mutation(api.applicants.updateStatus, {
          id: data.applicantId,
          status: "REJECTED",
          stage: "research_failed",
        });

        return {
          early_reject: true,
          reason: `Verification failed: ${parsed.summary}`,
          candidateEmail: data.candidateEmail,
          applicantId: data.applicantId,
        };
      }

      return {
        ...data,
        researchResult: parsed,
      };
    },
  })

  // STAGE 4: SCREENING
  .andThen({
    id: "technical-screening",
    execute: async ({ data }) => {
      if (data.early_reject) return data;

      console.log("🔹 STAGE 3: Screener Agent");

      const screeningInput = `
Assess technical fit:

INTAKE DATA:
${JSON.stringify(data.intakeResult, null, 2)}

RESEARCH VERIFICATION:
${JSON.stringify(data.researchResult, null, 2)}

Generate interview questions and assess fit.
      `;

      const screeningResult = await screenerAgent.execute({
        input: screeningInput,
      });

      const parsed = JSON.parse(screeningResult);

      await convex.mutation(api.applicants.updateAgentData, {
        id: data.applicantId,
        category: "screening",
        data: parsed,
      });

      await convex.mutation(api.applicants.updateScore, {
        id: data.applicantId,
        category: "screening",
        score: parsed.screening_score,
      });

      return {
        ...data,
        screeningResult: parsed,
      };
    },
  })

  // STAGE 5: JUDGE DECISION
  .andThen({
    id: "final-judgment",
    execute: async ({ data }) => {
      if (data.early_reject) {
        return {
          decision: "REJECT" as const,
          candidate_email: data.candidateEmail,
          total_score: 0,
          summary: data.reason,
          applicantId: data.applicantId,
        };
      }

      console.log("🔹 STAGE 4: Judge Agent");

      // Calculate total score
      const applicant = await convex.query(api.applicants.getById, {
        id: data.applicantId,
      });
      const totalScore = applicant.totalScore;

      const judgeInput = `
Make final decision:

TOTAL SCORE: ${totalScore}/100

INTAKE: ${JSON.stringify(data.intakeResult, null, 2)}
RESEARCH: ${JSON.stringify(data.researchResult, null, 2)}
SCREENING: ${JSON.stringify(data.screeningResult, null, 2)}

Apply decision rules and provide reasoning.
      `;

      const judgeResult = await judgeAgent.execute({
        input: judgeInput,
      });

      const parsed = JSON.parse(judgeResult);

      await convex.mutation(api.applicants.updateAgentData, {
        id: data.applicantId,
        category: "judge",
        data: parsed,
      });

      return {
        decision: parsed.decision,
        candidate_email: data.candidateEmail,
        total_score: totalScore,
        summary: parsed.candidate_summary,
        employer_summary: parsed.employer_summary,
        applicantId: data.applicantId,
        judgeResult: parsed,
        candidateData: data.intakeResult.extracted_data,
      };
    },
  })

  // STAGE 6: COORDINATOR (if PROCEED)
  .andThen({
    id: "schedule-interview",
    execute: async ({ data }) => {
      if (data.decision !== "PROCEED") {
        return data; // Skip scheduling
      }

      console.log("🔹 STAGE 5: Coordinator Agent");

      const coordinatorInput = `
Schedule interview for:
- Name: ${data.candidateData.name}
- Email: ${data.candidate_email}

Use the schedule_interview tool.
      `;

      const coordinatorResult = await coordinatorAgent.execute({
        input: coordinatorInput,
      });

      const parsed = JSON.parse(coordinatorResult);

      if (parsed.meeting_link) {
        await convex.mutation(api.applicants.addInterview, {
          id: data.applicantId,
          meetingLink: parsed.meeting_link,
          interviewTime: parsed.scheduled_time,
          calendarEventId: parsed.calendar_event_id,
        });
      }

      return {
        ...data,
        meetingDetails: parsed,
      };
    },
  });