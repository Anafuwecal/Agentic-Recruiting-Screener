import { Annotation } from "@langchain/langgraph";

// Fully typed interfaces to prevent 'any' leakage across the graph channels
export interface CandidateData {
  name: string;
  email: string;
  subject: string;
  emailBody: string;
  cvText: string;
  githubUrl?: string | undefined;
  portfolioUrl?: string | undefined;
}

export interface VerificationData {
  isProfessionValid: boolean;
  claimsVerified: boolean;
  backgroundSummary: string;
}

export interface FluffItem {
  claim: string;
  findingReason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  isValid: boolean;
}

export interface AssessmentData {
  generatedPrompt?: string;
  submittedCode?: string;
  technicalScores?: number;
  reviewerReasoning?: string;
  passedAssessment?: boolean;
}

export interface LogisticsData {
  googleMeetLink?: string;
  scheduledInterviewDate?: string;
}

// Defining the LangGraph channels structure
export const CandidateScreeningState = Annotation.Root({
  candidateInfo: Annotation<CandidateData>(),
  verificationReport: Annotation<VerificationData>(),
  fluffReport: Annotation<FluffItem[]>({
    reducer: (oldState, newState) => oldState.concat(newState),
    default: () => [],
  }),
  assessment: Annotation<AssessmentData>(),
  logistics: Annotation<LogisticsData>(),
  pipelineStatus: Annotation<string>(),
});

// Create a structural type export for compiling nodes
export type GraphStateType = typeof CandidateScreeningState.State;