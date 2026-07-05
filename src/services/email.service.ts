import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


export async function sendRealEmail(to: string, subject: string, body: string): Promise<void> {
  // Graceful degradation check
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(` [MOCK EMAIL]: SMTP credentials missing. Mocking email to ${to}`);
    console.log(`Subject: ${subject}\nBody: ${body}`);
    return; // Exit early, preventing crashes
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text: body });
    console.log(` [EMAIL]: Delivered to ${to}`);
  } catch (error) {
    console.error(` [EMAIL]: Failed to send to ${to}`, error);
  }
}