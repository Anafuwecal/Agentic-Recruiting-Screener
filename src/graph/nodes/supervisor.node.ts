import { GraphStateType } from "../state.ts";
import { aiModelClient } from "../../utils/llm.ts";

// Mock Outbound Email Dispatch Utility
async function sendRecruiterAlertEmail(candidateName: string, roleSubject: string): Promise<void> {
  console.log(`[EMAIL SERVICE]: Outbound message sent to recruiter@company.com -> 'Alert: New Candidate Application Received from ${candidateName} for ${roleSubject}'`);
}

export async function supervisorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[SUPERVISOR AGENT]: Running initial scorecard checklist assessment...");

  const { candidateInfo } = state;
  if (!candidateInfo) {
    throw new Error("Missing candidate context in graph state channels.");
  }

  // 1. Instantly trigger real-time notification to hiring teams
  await sendRecruiterAlertEmail(candidateInfo.name, candidateInfo.subject);

  // 2. Evaluate Core Scorecard Prerequisites
  const hasGitHub = !!candidateInfo.githubUrl && candidateInfo.githubUrl.trim().length > 10;
  const hasValidCv = !!candidateInfo.cvText && candidateInfo.cvText.trim().length > 30;

  if (!hasGitHub || !hasValidCv) {
    console.log("[SUPERVISOR AGENT]: Scorecard Check Failed. Missing required application artifacts.");
    return {
      pipelineStatus: "SUPERVISOR_FAILED_SCORECARD",
    };
  }

  console.log("[SUPERVISOR AGENT]: Scorecard criteria cleared. Handing application over to Intake Agent.");
  return {
    pipelineStatus: "SUPERVISOR_PASSED",
  };
}