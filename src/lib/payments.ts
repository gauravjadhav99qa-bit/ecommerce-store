import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { signReceipt } from "@/lib/receipt";

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gtshoppingonline.in";

/**
 * Idempotently mark an order as paid and trigger digital delivery.
 * Safe to call from both the client verify endpoint and the webhook.
 */
export async function markOrderPaid(opts: {
  orderNumber?: string;
  orderId?: string;
  razorpayOrderId?: string;
  paymentId: string;
}): Promise<{ orderNumber: string; receiptToken: string; alreadyPaid: boolean } | null> {
  const order = opts.orderId
    ? await prisma.order.findUnique({ where: { id: opts.orderId } })
    : opts.razorpayOrderId
      ? await prisma.order.findUnique({ where: { razorpayOrderId: opts.razorpayOrderId } })
      : opts.orderNumber
        ? await prisma.order.findUnique({ where: { orderNumber: opts.orderNumber } })
        : null;

  if (!order) return null;

  if (order.paidAt) {
    return {
      orderNumber: order.orderNumber,
      receiptToken: signReceipt(order.id),
      alreadyPaid: true,
    };
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentIntent: opts.paymentId,
      status: "PAID",
      paidAt: new Date(),
    },
    include: { items: true },
  });

  const receiptToken = signReceipt(updated.id);
  const downloadUrl = `${siteUrl()}/download/${updated.orderNumber}?t=${receiptToken}`;

  if (updated.shippingEmail) {
    sendOrderConfirmation(
      updated.shippingEmail,
      updated.orderNumber,
      updated.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      updated.total,
      downloadUrl
    ).catch((err) => console.error("[Order Email] Failed:", err));
  }

  return {
    orderNumber: updated.orderNumber,
    receiptToken,
    alreadyPaid: false,
  };
}
