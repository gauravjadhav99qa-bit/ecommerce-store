import prisma from "./prisma";
import { sendSmsOtp } from "./sms";

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
