import { z } from "zod";
import { GraphStateType } from "../state.js";
import { aiModelClient } from "../../utils/llm.js";

// Exact extraction schema matching data normalization criteria
const CoreExtractionSchema = z.object({
  extractedName: z.string().describe("The full legal name of the applicant"),
  extractedEmail: z.string().email().describe("The primary verified email address of the applicant"),
  coverLetterBrief: z.string().describe("A summarized snapshot of the core motivation derived from the cover letter text or email body"),
  primaryTechStack: z.array(z.string()).describe("List of engineering technologies, frameworks, and programming languages explicitly claimed"),
});

export async function intakeNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[INTAKE AGENT]: Commencing structural data extraction routines...");

  const rawData = state.candidateInfo;
  
  const processingPrompt = `
    Analyze the following raw application details and extract structured fields:
    Applicant Declared Name: ${rawData.name}
    Applicant Declared Email: ${rawData.email}
    Email Cover Context: ${rawData.emailBody}
    Raw CV Text Segment: ${rawData.cvText}
  `;

  // Bind the extraction schema to enforce strict JSON structure
  const structuredExtractor = aiModelClient.withStructuredOutput(CoreExtractionSchema, {
    name: "ProfileExtractor",
  });

  const extractionResult = await structuredExtractor.invoke(processingPrompt);

  console.log("[INTAKE AGENT]: Finished structural profile extraction.");
  
  // Update state parameters safely by merging historical records with newly discovered items
  return {
    candidateInfo: {
      ...rawData,
      name: extractionResult.extractedName,
      email: extractionResult.extractedEmail,
      emailBody: extractionResult.coverLetterBrief, // Update text with clean summary
    },
    pipelineStatus: "INTAKE_COMPLETED",
  };
}