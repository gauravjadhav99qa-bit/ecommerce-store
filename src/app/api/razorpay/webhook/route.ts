import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderPaid } from "@/lib/payments";

/**
 * Razorpay webhook — reliable payment confirmation even if the customer
 * closes the tab after paying. Configure in Razorpay dashboard:
 *   URL: <site>/api/razorpay/webhook
 *   Secret: RAZORPAY_WEBHOOK_SECRET
 * Events handled: payment.captured (idempotent).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event?.event === "payment.captured") {
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const paymentId = payment?.id;
    if (razorpayOrderId && paymentId) {
      try {
        const result = await markOrderPaid({ razorpayOrderId, paymentId });
        if (result?.alreadyPaid) {
          console.log(`[WEBHOOK] Order ${result.orderNumber} already marked paid — acknowledged`);
        }
      } catch (err) {
        console.error("[WEBHOOK] markOrderPaid failed:", err);
        // Return 500 so Razorpay retries.
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
