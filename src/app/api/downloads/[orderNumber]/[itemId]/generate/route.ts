import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canAccessOrder, loadOrder, getImagesForProduct } from "@/lib/download-auth";
import { buildProductPdf } from "@/lib/product-pdf";
import { prisma } from "@/lib/prisma";

/**
 * GET — generate a combined PDF on-demand from a product's current cover images.
 * Used when a product has images but no stored PDF file, so customers always
 * receive the latest uploaded artwork (never a stale/previous file).
 *
 * Auth: same rules as other download routes (owner, email match, or ?t= token).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string; itemId: string }> }
) {
  try {
    const { orderNumber, itemId } = await params;
    const order = await loadOrder(orderNumber);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const viewer = await getSessionUser(req);
    const token = req.nextUrl.searchParams.get("t");
    if (!canAccessOrder(order, viewer, token)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found in this order" }, { status: 404 });
    }

    const { name, images } = await getImagesForProduct(item.productId);
    if (images.length === 0) {
      return NextResponse.json({ error: "No downloadable content available" }, { status: 404 });
    }

    const pdfBytes = await buildProductPdf(images, name || item.name);
    if (!pdfBytes) {
      return NextResponse.json(
        { error: "Could not generate a PDF from the available images" },
        { status: 404 }
      );
    }

    // Record the download event (best-effort).
    try {
      await prisma.downloadEvent.create({
        data: {
          orderItemId: item.id,
          orderId: order.id,
          fileName: `${item.name}.pdf`,
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        },
      });
    } catch {
      // non-fatal
    }

    if (!item.downloaded) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { downloaded: true },
      });
    }

    const fileName = `${(name || item.name).replace(/[^a-zA-Z0-9 _-]/g, "")}.pdf`;
    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
