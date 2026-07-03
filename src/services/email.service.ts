import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // Change if using SendGrid/Resend
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendRealEmail(to: string, subject: string, body: string): Promise<void> {
  console.log(` [EMAIL SERVICE]: Sending physical email to ${to}...`);
  try {
    await transporter.sendMail({
      from: `"AI Recruiter" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
    });
    console.log(` [EMAIL SERVICE]: Delivered successfully to ${to}`);
  } catch (error) {
    console.error(` [EMAIL SERVICE]: Failed to send email to ${to}`, error);
  }
}