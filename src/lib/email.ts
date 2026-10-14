import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "GT Shopping <noreply@gtshoppingonline.in>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gtshoppingonline.in";

function getSmtpTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
}

function fromAddress(): string {
  return process.env.SMTP_FROM || FROM_EMAIL;
}

/**
 * Send email via Resend first, fall back to SMTP (Gmail) if Resend fails
 * or has no API key. Never throws on total failure — logs and returns null
 * so payment flows are not blocked by email delivery issues.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  const lastError: unknown[] = [];

  if (process.env.RESEND_API_KEY) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      if (result.error) {
        console.error("[EMAIL] Resend error:", result.error);
        lastError.push(result.error);
      } else {
        console.log(`[EMAIL] Resend → ${to} | id: ${result.data?.id}`);
        return { ok: true as const, provider: "resend" as const, id: result.data?.id };
      }
    } catch (err) {
      console.error("[EMAIL] Resend failed:", err);
      lastError.push(err);
    }
  }

  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress(),
        to,
        subject,
        html,
      });
      console.log(`[EMAIL] SMTP → ${to} | id: ${info.messageId}`);
      return { ok: true as const, provider: "smtp" as const, id: info.messageId };
    } catch (err) {
      console.error("[EMAIL] SMTP failed:", err);
      lastError.push(err);
    }
  }

  console.error(
    `[EMAIL] All providers failed for ${to}. Attempts: ${lastError.length}`,
    lastError
  );
  return { ok: false as const, provider: null, error: lastError[0] };
}

function shell(title: string, bodyHtml: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background-color:#FDF8F3;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F3;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(43,33,24,0.08);">
        <tr>
          <td style="background-color:#2B2118;padding:26px 36px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:700;color:#FDF8F3;">GT <span style="color:#F0A33B;">Shopping</span></p>
            <p style="margin:6px 0 0;font-size:11px;color:#FDF8F3AA;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Printables · Instant Download</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#2B2118;">${title}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background-color:#FDF8F3;padding:22px 36px;text-align:center;border-top:1px solid #F6EDE2;">
            <p style="margin:0;font-size:12px;color:#6B5A4A;font-family:Arial,sans-serif;">Questions? Just reply to this email — we&apos;re happy to help.</p>
            <p style="margin:8px 0 0;font-size:11px;color:#6B5A4A99;font-family:Arial,sans-serif;">© ${new Date().getFullYear()} GT Shopping · <a href="${SITE_URL}" style="color:#C2517E;text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
  </body>
  </html>
  `;
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: "login" | "signup" = "login"
) {
  const actionText =
    purpose === "signup" ? "create your GT Shopping account" : "sign in to your GT Shopping account";
  return sendEmail(
    to,
    `Your sign-in code is ${code} — GT Shopping`,
    shell(
      "Verification code",
      `
      <p style="margin:0 0 12px;font-size:15px;color:#6B5A4A;font-family:Arial,sans-serif;line-height:1.6;">
        Use this code to ${actionText}:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color:#FDF8F3;border:2px dashed #F6EDE2;border-radius:12px;padding:24px;text-align:center;">
            <p style="margin:0;font-size:40px;font-weight:bold;color:#2B2118;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B5A4A;font-family:Arial,sans-serif;">
        This code is valid for <strong>10 minutes</strong>. Never share it with anyone.
      </p>
      `
    )
  );
}

export async function sendOrderConfirmation(
  to: string,
  orderNumber: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  downloadUrl?: string
) {
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:10px;border-bottom:1px solid #F6EDE2;color:#2B2118;">${i.name}</td><td style="padding:10px;border-bottom:1px solid #F6EDE2;text-align:right;color:#6B5A4A;">₹${(i.price / 100).toFixed(0)}</td></tr>`
    )
    .join("");

  const downloadBlock = downloadUrl
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr><td style="background-color:#C2517E;border-radius:999px;padding:16px;text-align:center;">
          <a href="${downloadUrl}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif;">Download your files →</a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#6B5A4A;font-family:Arial,sans-serif;">
        Your printables are ready. You can also find them anytime under
        <strong>My Downloads</strong> after signing in with this email address.
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#6B5A4A;font-family:Arial,sans-serif;word-break:break-all;">
        Link: <a href="${downloadUrl}" style="color:#C2517E;">${downloadUrl}</a>
      </p>
      `
    : "";

  return sendEmail(
    to,
    `Your download is ready — ${orderNumber} | GT Shopping`,
    shell(
      "Payment received!",
      `
      <p style="margin:0 0 16px;font-size:15px;color:#6B5A4A;font-family:Arial,sans-serif;line-height:1.6;">
        Thank you! Your order <strong style="color:#2B2118;">${orderNumber}</strong> is confirmed.
      </p>
      ${downloadBlock}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;border-collapse:collapse;">
        <thead><tr style="background:#FDF8F3;">
          <th style="padding:10px;text-align:left;font-size:12px;color:#6B5A4A;font-family:Arial,sans-serif;">Item</th>
          <th style="padding:10px;text-align:right;font-size:12px;color:#6B5A4A;font-family:Arial,sans-serif;">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin:12px 0 0;font-size:18px;font-weight:bold;text-align:right;color:#2B2118;font-family:Arial,sans-serif;">Total: ₹${(total / 100).toFixed(0)}</p>
      <p style="margin:16px 0 0;font-size:12px;color:#6B5A4A;font-family:Arial,sans-serif;">
        <em>These are digital products — no shipping needed. Print at home on A4 or US Letter at 100% scale.</em>
      </p>
      `
    )
  );
}
