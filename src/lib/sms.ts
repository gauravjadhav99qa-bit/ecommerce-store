import type { OtpPurpose } from "./otp";

/**
 * Sends an OTP SMS via MSG91 flow API (production) or Fast2SMS (fallback).
 * Returns false when no provider is configured or the provider rejects.
 */
export async function sendSmsOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose = "login"
): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const flowId =
    purpose === "signup"
      ? process.env.MSG91_FLOW_ID_SIGNUP
      : process.env.MSG91_FLOW_ID_LOGIN;

  if (authKey && flowId) {
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
      if (!ok) console.error("[SMS] MSG91 rejected:", JSON.stringify(data));
      return ok;
    } catch (error) {
      console.error("[SMS] MSG91 send failed:", error);
      return false;
    }
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: { authorization: fast2smsKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          variables_values: code,
          route: "otp",
          numbers: phone,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      return data.return === true;
    } catch (error) {
      console.error("[SMS] Fast2SMS send failed:", error);
      return false;
    }
  }

  console.log(`[SMS] no provider configured, OTP for ${phone}: ${code}`);
  return false;
}
