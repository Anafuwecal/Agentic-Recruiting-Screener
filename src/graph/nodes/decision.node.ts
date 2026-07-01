import { z } from "zod";
import { GraphStateType } from "../state.ts";
import { aiModelClient } from "../../utils/llm.ts";

const EvaluationSchema = z.object({
  isPass: z.boolean().describe("True if the code meets senior engineering standards, False if it fails."),
  score: z.number().min(0).max(100).describe("Overall score out of 100 based on code quality and logic."),
  feedback: z.string().describe("A professional paragraph explaining the decision."),
  matrix: z.array(z.string()).describe("A list of 3-4 specific technical criteria evaluated (e.g., 'Error Handling: Passed')")
});

export async function decisionNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log("[DECISION AGENT]: Evaluating candidate code submission...");

  const prompt = state.assessment?.generatedPrompt || "No prompt found.";
  const code = state.assessment?.submittedCode || "No code submitted.";

  const evaluationPrompt = `
    You are an elite Staff Software Engineer grading a take-home assessment.
    
    Original Assessment Prompt:
    ${prompt}
    
    Candidate's Code Submission:
    ${code}
    
    Evaluate this submission. Be strict but fair.
  `;

  const structuredJudge = aiModelClient.withStructuredOutput(EvaluationSchema, {
    name: "CodeEvaluator",
  });

  const evaluationResult = await structuredJudge.invoke(evaluationPrompt);

  console.log(`[DECISION AGENT]: Grading complete. Candidate Score: ${evaluationResult.score}/100. Status: ${evaluationResult.isPass ? "PASS" : "FAIL"}`);

  return {
    evaluation: {
      isPass: evaluationResult.isPass,
      score: evaluationResult.score,
      feedback: evaluationResult.feedback,
      matrix: evaluationResult.matrix,
    },
    pipelineStatus: evaluationResult.isPass ? "EVALUATION_PASSED" : "EVALUATION_FAILED",
  };
}