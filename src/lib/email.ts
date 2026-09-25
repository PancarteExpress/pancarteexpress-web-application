import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@pancarteexpress.com",
    to: email,
    subject: "Code de vérification - Pancarte Express",
    html: `
      <h1>Vérifiez votre email</h1>
      <p>Votre code de vérification est:</p>
      <h2>${code}</h2>
      <p>Ce code expire dans 15 minutes.</p>
    `,
  });
}