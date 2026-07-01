import { GraphStateType } from "../state.ts";
import { aiModelClient } from "../../utils/llm.ts";

// Mock Outbound Email Dispatch Utility
async function sendAssessmentEmail(candidateName: string, email: string, prompt: string): Promise<void> {
  console.log(`\n [EMAIL SERVICE]: Dispatching Technical Assessment to ${email}...`);
  console.log(`Subject: Your Engineering Assessment\nDear ${candidateName},\nHere is your custom challenge:\n${prompt}\n`);
}

export async function screenerNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log(" [TECHNICAL SCREENER]: Generating role-specific engineering challenge...");

  const { candidateInfo } = state;
  const techStack = candidateInfo.primaryTechStack?.join(", ") || "General Software Engineering";

  const promptRequest = `
    Create a short, practical take-home engineering challenge for a candidate.
    Candidate Role Context: ${candidateInfo.subject}
    Candidate Claimed Stack: ${techStack}
    
    The challenge should take no more than 2 hours. Ask them to design a small system, write an API endpoint, or solve a specific problem using their stack.
    Return ONLY the assessment prompt text, ready to be emailed. Do not include introductory conversational text.
  `;

  // Standard invoke for text generation (no strict JSON schema needed here)
  const response = await aiModelClient.invoke(promptRequest);
  const generatedPrompt = response.content.toString();

  // Dispatch the email to the candidate
  await sendAssessmentEmail(candidateInfo.name, candidateInfo.email, generatedPrompt);

  console.log(" [TECHNICAL SCREENER]: Challenge dispatched. Signaling graph engine to pause and wait for submission.");

  return {
    assessment: {
      generatedPrompt: generatedPrompt,
    },
    pipelineStatus: "AWAITING_SUBMISSION", // This flag triggers the execution pause
  };
}