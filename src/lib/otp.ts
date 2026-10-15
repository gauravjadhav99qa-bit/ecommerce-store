import prisma from "./prisma";
import { sendSmsOtp } from "./sms";
import { sendOtpEmail } from "./email";

export type OtpPurpose = "signup" | "login";

export function otpTestMode(): boolean {
  return process.env.OTP_TEST_MODE === "true";
}

function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a fresh OTP for the phone (replaces any existing codes) and sends
 * it by SMS. In OTP_TEST_MODE the code is always 123456 and no SMS is sent.
 */
export async function createAndSendOtp(
  phone: string,
  purpose: OtpPurpose
): Promise<{ sent: boolean; testMode: boolean }> {
  const code = otpTestMode() ? "123456" : generateRandomOtp();

  await prisma.otp.deleteMany({ where: { phone } });
  await prisma.otp.create({
    data: {
      phone,
      code,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (otpTestMode()) {
    console.log(`[OTP] test mode: ${phone} -> ${code} (${purpose})`);
    return { sent: true, testMode: true };
  }

  const sent = await sendSmsOtp(phone, code, purpose);
  if (!sent) {
    console.error(`[OTP] SMS send failed for ${phone} (${purpose})`);
  }
  return { sent, testMode: false };
}

/**
 * Creates a fresh OTP for the email address (stored in otps.phone as the
 * identifier) and sends it via the branded transactional email template.
 * In OTP_TEST_MODE the code is always 123456 and no email is sent.
 */
export async function createAndSendEmailOtp(
  email: string,
  purpose: OtpPurpose
): Promise<{ sent: boolean; testMode: boolean }> {
  const code = otpTestMode() ? "123456" : generateRandomOtp();

  await prisma.otp.deleteMany({ where: { phone: email } });
  await prisma.otp.create({
    data: {
      phone: email,
      code,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (otpTestMode()) {
    console.log(`[OTP] test mode: ${email} -> ${code} (${purpose})`);
    return { sent: true, testMode: true };
  }

  try {
    const result = await sendOtpEmail(email, code, purpose);
    if (!result?.ok) {
      console.error(
        `[OTP] email send failed for ${email} (${purpose}):`,
        result?.error ?? "unknown provider error"
      );
      return { sent: false, testMode: false };
    }
    console.log(`[OTP] email sent via ${result.provider} to ${email}`);
    return { sent: true, testMode: false };
  } catch (error) {
    console.error(`[OTP] email send failed for ${email} (${purpose}):`, error);
    return { sent: false, testMode: false };
  }
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (!phone || !code) return false;
  const entry = await prisma.otp.findFirst({
    where: { phone, code },
    orderBy: { createdAt: "desc" },
  });

  if (!entry) return false;
  if (Date.now() > entry.expires.getTime()) {
    await prisma.otp.delete({ where: { id: entry.id } });
    return false;
  }

  await prisma.otp.deleteMany({ where: { phone } });
  return true;
}
