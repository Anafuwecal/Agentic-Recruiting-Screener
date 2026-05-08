import { VoltAgent, Agent } from "@voltagent/core";
import { groq } from "@ai-sdk/groq"; // Import the Groq provider
import { screeningWorkflow } from "../workflows/screeningWorkflow";
import { EmailService } from "../services/emailService";

const emailService = new EmailService();

export const orchestratorAgent = new Agent({
  name: "OrchestratorSupervisor",
  model: groq("llama-3.1-70b-versatile"),
  instructions: `You are the ORCHESTRATOR - the supervisor of all recruitment agents.

YOUR RESPONSIBILITIES:
1. Receive applications via email webhook
2. Trigger the screening workflow
3. Supervise all agent outputs
4. Send ALL emails (agents never contact directly)
5. Alert employer immediately when application received
6. Handle all rejections and acceptances
7. Maintain audit trail

You coordinate the entire pipeline but delegate execution to specialized agents.`,
  tools: [],
});

export async function processApplication(
  emailContent: string,
  attachmentText?: string
) {
  console.log("🎯 ORCHESTRATOR: New application received");

  try {
    // Execute the workflow
    const result = await screeningWorkflow.execute({
      email_content: emailContent,
      attachment_text: attachmentText,
    });

    console.log("📊 Final Result:", result);

    // ORCHESTRATOR handles all email communication
    if (result.decision === "REJECT") {
      await emailService.sendRejectionEmail(
        result.candidate_email,
        result.summary
      );
      await emailService.notifyEmployerRejection(result);
    } else if (result.decision === "HUMAN_REVIEW") {
      await emailService.sendHumanReviewRequest(result);
    } else if (result.decision === "PROCEED") {
      await emailService.sendInterviewInvitation(result);
      await emailService.notifyEmployerInterview(result);
    }

    console.log("✅ ORCHESTRATOR: Process complete");
  } catch (error: any) {
    console.error("❌ ORCHESTRATOR ERROR:", error.message);
    throw error;
  }
}