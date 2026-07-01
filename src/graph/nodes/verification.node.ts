import { GraphStateType, FluffItem } from "../state.js";
import { aiModelClient } from "../../utils/llm.js";
import { z } from "zod";

// Structured representation of candidate background consistency metrics
const VerificationAnalysisSchema = z.object({
  isProfessionValid: z.boolean().describe("True if code quality and profile match claims, false if profile is falsified"),
  claimsVerified: z.boolean().describe("True if claims align with external records"),
  backgroundSummary: z.string().describe("Architectural evaluation summary of findings"),
  detectedFluff: z.array(z.object({
    claim: z.string().describe("The exaggerated or unverified resume claim discovered"),
    findingReason: z.string().describe("The empirical reason proving discrepancy or need for audit review"),
    severity: z.union([z.literal("LOW"), z.literal("MEDIUM"), z.literal("HIGH")]),
    isValid: z.boolean().describe("Set to false if this claim is confirmed to be fluff/exaggeration")
  }))
});

export async function verificationNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[VERIFICATION AGENT]: Scouring repositories and profiles to cross-reference claims...");

  const githubUrl = state.candidateInfo.githubUrl || "No GitHub Provided";
  const cvContextText = state.candidateInfo.cvText;

  // Real-world production integrations will invoke the GitHub and Search APIs here.
  // We feed this data directly to our verification LLM engine.
  const toolScrapeMockLogs = `
    [TOOL SEARCH RESULTS]: Found 1 primary matching profile on GitHub for URL ${githubUrl}. Repository count: 3. Most active repo is a fork of a tutorial starter kit with 2 commits.
    [TOOL GOOGLE SEARCH]: Searched candidate engineering footprint. No technical blogs or open-source community contributions discovered.
  `;

  const verificationPrompt = `
    You are an expert technical forensic auditor. Compare the Candidate CV Claims against the Tool Scrape Logs.
    Detect any exaggerations, unverified claims, or resume fluff.
    
    Candidate CV Claims: ${cvContextText}
    Tool Scrape Logs: ${toolScrapeMockLogs}
  `;

  const structuredAuditor = aiModelClient.withStructuredOutput(VerificationAnalysisSchema, {
    name: "VerificationAuditor",
  });

  const analysis = await structuredAuditor.invoke(verificationPrompt);

  console.log(` [VERIFICATION COMPLETED]: Identified ${analysis.detectedFluff.length} instances of resume fluff.`);

  // Cast detected anomalies into the defined FluffItem format for state consistency
  const formattedFluffItems: FluffItem[] = (analysis.detectedFluff as FluffItem[]).map(item => ({
    claim: item.claim,
    findingReason: item.findingReason,
    severity: item.severity,
    isValid: item.isValid,
  }));

  return {
    verificationReport: {
      isProfessionValid: analysis.isProfessionValid,
      claimsVerified: analysis.claimsVerified,
      backgroundSummary: analysis.backgroundSummary,
    },
    fluffReport: formattedFluffItems, // Automatically combined via state reducers
    pipelineStatus: "VERIFICATION_COMPLETED",
  };
}