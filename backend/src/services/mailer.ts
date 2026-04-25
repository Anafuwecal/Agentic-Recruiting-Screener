import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMPLOYER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmailToEmployer(subject: string, htmlBody: string) {
  console.log(`[MAILER] Sending to employer: ${subject}`);
  await transporter.sendMail({
    from: `"Recruiting AI" <${process.env.EMPLOYER_EMAIL}>`,
    to: process.env.EMPLOYER_EMAIL,
    subject,
    html: htmlBody,
  });
}

export async function sendEmailToCandidate(
  to: string,
  subject: string,
  htmlBody: string
) {
  console.log(`[MAILER] Sending to candidate ${to}: ${subject}`);
  await transporter.sendMail({
    from: `"${process.env.COMPANY_NAME} Recruiting" <${process.env.EMPLOYER_EMAIL}>`,
    to,
    subject,
    html: htmlBody,
  });
}