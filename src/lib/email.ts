import nodemailer from "nodemailer";

export type EmailLocale = "fr" | "en";

const FROM = process.env.SMTP_FROM ?? "noreply@pancarteexpress.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface CodeEmailTemplate {
  subject: string;
  heading: string;
  intro: string;
  expiry: string;
}

const TEMPLATES = {
  verification: {
    fr: {
      subject: "Code de vérification - Pancarte Express",
      heading: "Vérifiez votre adresse courriel",
      intro: "Votre code de vérification est :",
      expiry: "Ce code expire dans 15 minutes.",
    },
    en: {
      subject: "Verification code - Pancarte Express",
      heading: "Verify your email address",
      intro: "Your verification code is:",
      expiry: "This code expires in 15 minutes.",
    },
  },
  passwordReset: {
    fr: {
      subject: "Réinitialisation du mot de passe - Pancarte Express",
      heading: "Réinitialisez votre mot de passe",
      intro: "Votre code de réinitialisation est :",
      expiry: "Ce code expire dans 15 minutes. Si vous n'avez pas fait cette demande, ignorez ce courriel.",
    },
    en: {
      subject: "Password reset - Pancarte Express",
      heading: "Reset your password",
      intro: "Your password reset code is:",
      expiry: "This code expires in 15 minutes. If you didn't request this, ignore this email.",
    },
  },
} satisfies Record<string, Record<EmailLocale, CodeEmailTemplate>>;

async function sendCodeEmail(to: string, code: string, t: CodeEmailTemplate): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: t.subject,
    // Version texte : améliore la délivrabilité et sert de repli aux clients sans HTML
    text: `${t.intro} ${code}\n\n${t.expiry}`,
    html: `
      <h1>${t.heading}</h1>
      <p>${t.intro}</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>${t.expiry}</p>
    `,
  });
}

export function sendVerificationEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.verification[locale]);
}

export function sendPasswordResetEmail(
  email: string,
  code: string,
  locale: EmailLocale = "fr",
): Promise<void> {
  return sendCodeEmail(email, code, TEMPLATES.passwordReset[locale]);
}