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
  primaryTechStack?: string[];
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

export interface EvaluationData {
  isPass: boolean;
  score: number;
  feedback: string;
  matrix: string[];
}

export interface LogisticsData {
  interviewDate?: string;
  meetLink?: string | undefined;
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
  evaluation: Annotation<EvaluationData>(),
  logistics: Annotation<LogisticsData>(),
  finalReport: Annotation<string>(),
  pipelineStatus: Annotation<string>(),
});

// 3. Create a structural type export for compiling nodes
export type GraphStateType = typeof CandidateScreeningState.State;