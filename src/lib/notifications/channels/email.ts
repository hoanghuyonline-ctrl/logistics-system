import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function getSmtpConfig() {
  const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"];
  const dbConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const dbMap = new Map(dbConfigs.map((c) => [c.key, c.value]));

  return {
    host: dbMap.get("SMTP_HOST") || process.env.SMTP_HOST || "localhost",
    port: Number(dbMap.get("SMTP_PORT") || process.env.SMTP_PORT) || 587,
    secure: (dbMap.get("SMTP_SECURE") || process.env.SMTP_SECURE) === "true",
    user: dbMap.get("SMTP_USER") || process.env.SMTP_USER || "",
    pass: dbMap.get("SMTP_PASS") || process.env.SMTP_PASS || "",
    from: dbMap.get("SMTP_FROM") || process.env.SMTP_FROM || "noreply@vnlogistics.com",
  };
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const config = await getSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
