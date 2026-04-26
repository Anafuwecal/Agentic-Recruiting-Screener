import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMPLOYER_EMAIL!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

export async function mailEmployer(subject: string, body: string) {
  try {
    await transporter.sendMail({
      from: `"Recruiting AI" <${process.env.EMPLOYER_EMAIL}>`,
      to: process.env.EMPLOYER_EMAIL,
      subject,
      html: body,
    });
    console.log(`Email sent to employer: ${subject}`);
  } catch (error) {
    console.error('Failed to send email to employer:', error);
    throw error;
  }
}

export async function mailCandidate(to: string, subject: string, body: string) {
  try {
    await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME} Recruiting" <${process.env.EMPLOYER_EMAIL}>`,
      to,
      subject,
      html: body,
    });
    console.log(`Email sent to candidate: ${to}`);
  } catch (error) {
    console.error('Failed to send email to candidate:', error);
    throw error;
  }
}