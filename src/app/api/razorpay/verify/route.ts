import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { markOrderPaid } from "@/lib/payments";

async function getPaymentMode(): Promise<string> {
  try {
    const setting = await prisma.storeSettings.findUnique({ where: { key: "payment_mode" } });
    return setting?.value || "test";
  } catch {
    return "test";
  }
}

function getKeySecret(mode: string): string {
  if (mode === "live") {
    return process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  }
  return process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET!;
}

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }
    if (!orderNumber) {
      return NextResponse.json({ error: "Missing order number" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // The razorpay order must belong to this store order.
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: "Payment/order mismatch" }, { status: 400 });
    }

    const mode = await getPaymentMode();
    const keySecret = getKeySecret(mode);

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const sigBuf = Buffer.from(expectedSignature, "hex");
    const providedBuf = Buffer.from(String(razorpay_signature), "hex");
    const signatureValid =
      sigBuf.length === providedBuf.length && crypto.timingSafeEqual(sigBuf, providedBuf);

    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const result = await markOrderPaid({
      orderId: order.id,
      paymentId: razorpay_payment_id,
    });

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      paymentId: razorpay_payment_id,
      receiptToken: result.receiptToken,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Payment verification failed", details: message },
      { status: 500 }
    );
  }
}
