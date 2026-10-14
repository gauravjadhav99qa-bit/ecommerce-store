import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber } = await params;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const shippingAddr = order.shippingAddr
      ? typeof order.shippingAddr === "string"
        ? JSON.parse(order.shippingAddr)
        : order.shippingAddr
      : {};

    return NextResponse.json({
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
        image: item.image,
      })),
      subtotal: order.total + (shippingAddr.discount || 0),
      discount: shippingAddr.discount || 0,
      couponCode: shippingAddr.couponCode || null,
      shippingCost: 0,
      total: order.total,
      billing: {
        name: order.shippingName,
        email: order.shippingEmail,
        phone: order.shippingPhone,
      },
      status: order.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
