import { GraphStateType } from "../state.ts";
import { aiModelClient } from "../../utils/llm.ts";

export async function watcherNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[WATCHER AGENT]: Consolidating pipeline state into final executive brief...");

  const isPass = state.evaluation?.isPass;
  const fluffCount = state.fluffReport?.length || 0;

  const summaryPrompt = `
    Summarize the following candidate profile for the Hiring Manager in 3 concise paragraphs.
    
    Candidate: ${state.candidateInfo?.name} (${state.candidateInfo?.email})
    Fluff Detected: ${fluffCount} items.
    Technical Score: ${state.evaluation?.score}/100 (${isPass ? "PASSED" : "FAILED"})
    Judge Feedback: ${state.evaluation?.feedback}
    Interview Link: ${state.logistics?.meetLink || "None - Candidate Rejected"}
    
    Format nicely as an Executive Brief.
  `;

  const response = await aiModelClient.invoke(summaryPrompt);
  const finalBrief = response.content.toString();

  console.log(" [WATCHER AGENT]: Final brief synthesized. Pipeline execution completely finalized.");

  return {
    finalReport: finalBrief,
    pipelineStatus: "PIPELINE_COMPLETE",
  };
}