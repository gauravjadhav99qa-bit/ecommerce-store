import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canAccessOrder, loadOrder, getFilesForProduct } from "@/lib/download-auth";
import { issueProductDownload } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

/**
 * Issue fresh, short-lived signed download URLs for a single order item.
 * Used by the download page when a previous link has expired.
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

    const files = await getFilesForProduct(item.productId);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files available" }, { status: 404 });
    }

    const withUrls = [];
    for (const file of files) {
      const url = await issueProductDownload({ storagePath: file.storagePath });
      withUrls.push({
        id: file.id,
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
        url,
      });
      await prisma.downloadEvent.create({
        data: {
          orderItemId: item.id,
          orderId: order.id,
          fileName: file.fileName,
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        },
      });
    }

    if (!item.downloaded) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { downloaded: true },
      });
    }

    return NextResponse.json({
      itemId: item.id,
      name: item.name,
      files: withUrls,
    });
  } catch (error) {
    console.error("Download issue error:", error);
    return NextResponse.json({ error: "Failed to issue download" }, { status: 500 });
  }
}
