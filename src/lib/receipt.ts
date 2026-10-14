import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  return process.env.NEXTAUTH_SECRET || "dev-secret";
}

/**
 * Receipt token proves a guest (or anyone holding the post-payment link)
 * is entitled to view a specific paid order. Bound to the order id so it
 * cannot be reused for another order.
 */
export function signReceipt(orderId: string, ttlMs = DEFAULT_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const payload = `${orderId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyReceipt(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false;
  const expected = createHmac("sha256", secret())
    .update(`${orderId}.${exp}`)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
