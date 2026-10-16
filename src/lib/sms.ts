import type { OtpPurpose } from "./otp";

/**
 * Sends an OTP SMS via MSG91 flow API or Fast2SMS.
 * SMS_PROVIDER ("msg91" | "fast2sms") picks the preferred provider; the other
 * is tried automatically when the preferred one is missing or rejects.
 * Returns false when no provider is configured or all providers fail.
 */
export async function sendSmsOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose = "login"
): Promise<boolean> {
  const preferred = (process.env.SMS_PROVIDER || "").toLowerCase();
  const tryMsg91 = () => sendViaMsg91(phone, code, purpose);
  const tryFast2 = () => sendViaFast2Sms(phone, code);

  if (preferred === "fast2sms") {
    if (await tryFast2()) return true;
    console.warn("[SMS] Fast2SMS failed, falling back to MSG91");
    return tryMsg91();
  }

  if (await tryMsg91()) return true;
  if (process.env.FAST2SMS_API_KEY) {
    console.warn("[SMS] MSG91 failed, falling back to Fast2SMS");
    return tryFast2();
  }
  return false;
}

async function sendViaMsg91(
  phone: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const flowId =
    purpose === "signup"
      ? process.env.MSG91_FLOW_ID_SIGNUP
      : process.env.MSG91_FLOW_ID_LOGIN;

  if (!authKey || !flowId) return false;

  try {
    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flow_id: flowId,
        mobiles: `91${phone}`,
        var1: code,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    // MSG91 returns type: "success" on acceptance
    const ok = res.ok && (data?.type === "success" || data?.status === "success");
    console.log(`[SMS] MSG91 response for ${phone}:`, JSON.stringify(data));
    if (!ok) console.error("[SMS] MSG91 rejected:", JSON.stringify(data));
    return ok;
  } catch (error) {
    console.error("[SMS] MSG91 send failed:", error);
    return false;
  }
}

async function sendViaFast2Sms(phone: string, code: string): Promise<boolean> {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) return false;

  const call = async (body: Record<string, unknown>) => {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({}));
  };

  try {
    // 1) OTP route — pre-approved Fast2SMS OTP template, no DLT setup needed.
    let data: any = await call({ route: "otp", variables_values: code, numbers: phone });
    console.log(`[SMS] Fast2SMS otp-route response for ${phone}:`, JSON.stringify(data));
    if (data?.return === true) return true;

    // 2) Quick route — free-text with the code embedded, no DLT required.
    data = await call({
      route: "q",
      message: `Your GT Shopping login code is ${code}. Valid for 10 minutes.`,
      numbers: phone,
    });
    console.log(`[SMS] Fast2SMS quick-route response for ${phone}:`, JSON.stringify(data));
    return data?.return === true;
  } catch (error) {
    console.error("[SMS] Fast2SMS send failed:", error);
    return false;
  }
}
