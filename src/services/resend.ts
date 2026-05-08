import axios from 'axios';

export class ResendService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY!;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Email sent to ${to}:`, response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Resend error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendToEmployer(subject: string, html: string) {
    return this.sendEmail(process.env.EMPLOYER_EMAIL!, subject, html);
  }

  async sendToCandidate(email: string, subject: string, html: string) {
    return this.sendEmail(email, subject, html);
  }
}