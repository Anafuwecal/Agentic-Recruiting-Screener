import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export class EmailService {
  async sendRejectionEmail(candidateEmail: string, summary: string) {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: candidateEmail,
      subject: "Application Update",
      html: `<p>${summary}</p>`,
    });
    console.log(`📧 Sending rejection to ${candidateEmail}`);
    console.log(`Summary: ${summary}`);
    // TODO: Implement actual email sending (SMTP, SendGrid, etc.)
  }

  async notifyEmployerRejection(result: any) {
    console.log(`📧 Notifying employer of rejection`);
    console.log(`Candidate: ${result.candidate_email}`);
  }

  async sendHumanReviewRequest(result: any) {
    console.log(`📧 Sending human review request for ${result.candidate_email}`);
    console.log(`Score: ${result.total_score}`);
  }

  async sendInterviewInvitation(result: any) {
    console.log(`📧 Sending interview invitation to ${result.candidate_email}`);
    console.log(`Meeting: ${result.meetingDetails?.meeting_link}`);
  }

  async notifyEmployerInterview(result: any) {
    console.log(`📧 Notifying employer of scheduled interview`);
    console.log(`Candidate: ${result.candidate_email}`);
  }

  async alertEmployerNewApplication(candidateData: any) {
    console.log(`📧 Alerting employer of new application from ${candidateData.name}`);
  }
}