import { GraphStateType } from "../state.ts";
import { aiModelClient } from "../../utils/llm.ts";
import { sendRealEmail } from "../../services/email.service.ts";

// Mock email dispatcher utility
//async function sendRealEmail(to: string, subject: string, body: string): Promise<void> {
//  console.log(`\n [OUTBOUND MAIL]: Dispatching to ${to}\nSubject: ${subject}\nBody:\n${body}\n`);
//}

export async function mailerNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  console.log(" [Supervisor Mailer AGENT]: Preparing final outbound communications...");

  const candidateEmail = state.candidateInfo?.email || "candidate@unknown.com";
  const candidateName = state.candidateInfo?.name || "Candidate";
  const isPass = state.evaluation?.isPass;
  const recruiterEmail = process.env.RECRUITER_EMAIL || "recruiter@company.com";
  
  // 1. Dispatch Recruiter Brief (Internal)
  const recruiterSubject = `Screening Complete: ${candidateName} - ${isPass ? "PASSED" : "FAILED"}`;
  await sendRealEmail(recruiterEmail, recruiterSubject, state.finalReport!);

  // 2. Dispatch Candidate Email (External)
  if (isPass) {
    const meetLink = state.logistics?.meetLink || "TBD";
    const interviewDate = state.logistics?.interviewDate || "TBD";
    const passBody = `Hi ${candidateName},\n\nGreat news! Your technical assessment was excellent. 
    We would like to invite you to the next round.
    \n\nYour interview is scheduled for ${new Date(interviewDate).toDateString()}.
    \nJoin link: ${meetLink}\n\nLooking forward to speaking with you!`;
    
    await sendRealEmail(candidateEmail, "Next Steps: Your Application", passBody);
  } else {
    // Generate a highly specific, constructive rejection using the Judge's feedback
    const rejectionPrompt = `
      Write a kind, highly constructive rejection email for a software engineering candidate named ${candidateName}.
      They failed the technical assessment. 
      Here is the exact feedback from the Senior Engineer who reviewed their code: "${state.evaluation?.feedback}"
      
      Keep it professional, supportive, and provide the technical feedback so they can improve. 
      Do not sound like a generic robot template.
    `;
    const response = await aiModelClient.invoke(rejectionPrompt);
    const rejectionBody = response.content.toString();
    
    await sendRealEmail(candidateEmail, "Update on your application", rejectionBody);
  }

  console.log(" [MAILER AGENT]: All final communications dispatched successfully.");

  return {
    pipelineStatus: "COMPLETED_AND_NOTIFIED",
  };
}