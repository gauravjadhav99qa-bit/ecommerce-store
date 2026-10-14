import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { parseImages } from "@/lib/utils";
import { validateCoupon, getCouponByCode, incrementCouponUsage } from "@/lib/coupons";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(1) }))
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(200),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  }),
  couponCode: z.string().max(40).optional(),
});

async function generateOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `IB-${rand}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    if (!existing) return orderNumber;
  }
  throw new Error("Could not generate order number");
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const session = await getServerSession(authOptions);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide your name, email, mobile and cart items" },
        { status: 400 }
      );
    }
    const { items, customer, couponCode } = parsed.data;
    const email = customer.email.toLowerCase().trim();
    const phoneDigits = customer.phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required." },
        { status: 400 }
      );
    }

    // Server-side price lookup — never trust client prices.
    let subtotal = 0;
    const validItems: Array<{ productId: string; product: any }> = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.isActive || !product.isDigital) {
        return NextResponse.json(
          { error: "Some products in your cart are no longer available" },
          { status: 400 }
        );
      }
      subtotal += product.price;
      validItems.push({ productId: item.productId, product });
    }

    let discount = 0;
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode.toUpperCase(), subtotal);
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || "Invalid coupon code" },
          { status: 400 }
        );
      }
      discount = couponResult.discount;
      appliedCouponId = couponResult.coupon?.id || null;
    }

    const total = Math.max(0, subtotal - discount);
    if (total < 100) {
      return NextResponse.json(
        { error: "Order total must be at least ₹1" },
        { status: 400 }
      );
    }

    // Attach purchases to the logged-in user when available; guest checkout allowed.
    const userId = sessionUser?.id || null;
    const shippingPhone = phoneDigits;

    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        total,
        shippingName: customer.name,
        shippingEmail: email,
        shippingPhone,
        shippingAddr: JSON.stringify({
          discount,
          couponCode: couponCode ? couponCode.toUpperCase() : null,
          subtotal,
        }),
        userId: sessionUser?.id,
        items: {
          create: validItems.map(({ productId, product }) => ({
            name: product.name,
            price: product.price,
            quantity: 1,
            image: parseImages(product.images)[0] || null,
            isDigital: true,
            productId,
          })),
        },
      },
      include: { items: true },
    });

    if (appliedCouponId) {
      await incrementCouponUsage(appliedCouponId);
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.total,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
