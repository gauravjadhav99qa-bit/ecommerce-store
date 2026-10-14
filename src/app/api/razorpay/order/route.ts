import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getPaymentMode(): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const setting = await prisma.storeSettings.findUnique({ where: { key: "payment_mode" } });
      // Default live when unset; only explicit "test" uses test keys.
      return setting?.value === "test" ? "test" : "live";
    } catch (e) {
      console.error(`getPaymentMode attempt ${attempt} failed:`, e);
      if (attempt === 3) return "live";
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return "live";
}

function getRazorpayKeys(mode: string) {
  if (mode === "live") {
    return {
      key_id: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET!,
    };
  }
  return {
    key_id: process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET!,
  };
}

const schema = z.object({ orderNumber: z.string().min(3).max(40) });

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing order number" }, { status: 400 });
    }

    // Amount always comes from the server-side order, never the client.
    const order = await prisma.order.findUnique({
      where: { orderNumber: parsed.data.orderNumber },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paidAt) {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }
    if (order.total < 100) {
      return NextResponse.json({ error: "Amount must be at least ₹1" }, { status: 400 });
    }

    const mode = await getPaymentMode();
    const keys = getRazorpayKeys(mode);

    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const razorpay = new Razorpay(keys);
        const rzpOrder = await razorpay.orders.create({
          amount: order.total,
          currency: "INR",
          receipt: order.orderNumber,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: rzpOrder.id },
        });

        return NextResponse.json({
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          keyId: keys.key_id,
          mode,
        });
      } catch (error: any) {
        lastError = error;
        console.error(`Razorpay API attempt ${attempt} failed:`, error?.message || error);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    console.error("Razorpay order creation failed:", lastError);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error?.message || error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
