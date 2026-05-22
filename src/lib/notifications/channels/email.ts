/**
 * SMTP email channel — tunnel-safe transport with critical error logging.
 * @version 3.0.0 — Dynamic DB runtime binding; port-465 implicit-SSL enforcement
 */
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { prisma } from "@/lib/prisma";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Fetch SMTP settings fresh from the database on every call.
 * DB values take priority; process.env is the fallback.
 * Port 465 automatically forces secure = true (implicit SSL).
 */
async function getSmtpConfig() {
  const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"];
  const dbConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const dbMap = new Map(dbConfigs.map((c) => [c.key, c.value]));

  const host = dbMap.get("SMTP_HOST") || process.env.SMTP_HOST || "localhost";
  const port = Number(dbMap.get("SMTP_PORT") || process.env.SMTP_PORT) || 587;
  const secureSetting = (dbMap.get("SMTP_SECURE") || process.env.SMTP_SECURE) === "true";
  const secure = port === 465 ? true : secureSetting;
  const user = dbMap.get("SMTP_USER") || process.env.SMTP_USER || "";
  const pass = dbMap.get("SMTP_PASS") || process.env.SMTP_PASS || "";
  const from = dbMap.get("SMTP_FROM") || process.env.SMTP_FROM || "noreply@vnlogistics.com";

  const source = dbMap.size > 0 ? "DB" : "ENV";
  console.log(`[EMAIL/config] source=${source} dbKeys=${[...dbMap.keys()].join(",")||"none"} host=${host} port=${port} secure=${secure} from=${from}`);

  return { host, port, secure, user, pass, from };
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const config = await getSmtpConfig();

    console.log(`[EMAIL] Attempting send to=${options.to} subject="${options.subject}" hasHtml=${!!options.html} smtp=${config.host}:${config.port} secure=${config.secure} pool=false`);

    const transportOptions: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      connectionTimeout: 30_000,
      greetingTimeout: 15_000,
      socketTimeout: 60_000,
      tls: {
        rejectUnauthorized: false,
      },
    };
    const transporter = nodemailer.createTransport(transportOptions);

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`[EMAIL] Successfully sent to=${options.to}`);
  } catch (error) {
    console.error("❌ LIVE EMAIL NOTIFICATION FAILURE CRITICAL LOG:", error);
    throw error;
  }
}
