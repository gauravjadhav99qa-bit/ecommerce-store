import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canAccessOrder, loadOrder, getFilesForProduct } from "@/lib/download-auth";
import { issueProductDownload } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

/**
 * List downloadable files for a paid order.
 * Access requires: logged-in owner, logged-in email match, or valid receipt token (?t=).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const order = await loadOrder(orderNumber);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const viewer = await getSessionUser(req);
    const token = req.nextUrl.searchParams.get("t");

    if (!canAccessOrder(order, viewer, token)) {
      return NextResponse.json(
        { error: "Not authorized to access this order's files" },
        { status: 403 }
      );
    }

    const items = [];
    for (const item of order.items) {
      const files = await getFilesForProduct(item.productId);
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
      }
      items.push({
        id: item.id,
        name: item.name,
        image: item.image,
        files: withUrls,
      });
      if (withUrls.length > 0 && !item.downloaded) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { downloaded: true },
        });
      }
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.paidAt,
      items,
    });
  } catch (error) {
    console.error("Download list error:", error);
    return NextResponse.json({ error: "Failed to load downloads" }, { status: 500 });
  }
}
