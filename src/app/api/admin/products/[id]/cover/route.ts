import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { putCoverImage, ALLOWED_COVER_MIME_TYPES } from "@/lib/storage";
import { parseImages } from "@/lib/utils";

// Vercel serverless functions reject request bodies above ~4.5MB, so keep the
// cover limit safely under that to avoid an opaque 413 error.
const MAX_COVER_SIZE = 4 * 1024 * 1024; // 4MB

async function requireAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/**
 * POST — upload a catalogue cover image (multipart/form-data, field "image").
 * Appends the new URL to the product's images list and returns the updated product.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > MAX_COVER_SIZE) {
      return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 400 });
    }
    const mimeType = file.type || "image/png";
    if (!(ALLOWED_COVER_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP or SVG images are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await putCoverImage({
      productId: product.id,
      fileName: file.name || "cover.png",
      data: buffer,
      mimeType: mimeType as (typeof ALLOWED_COVER_MIME_TYPES)[number],
    });

    const existing = parseImages(product.images);
    const updated = await prisma.product.update({
      where: { id },
      data: { images: JSON.stringify([...existing, stored.url]) },
      include: { files: true },
    });

    return NextResponse.json({ url: stored.url, product: updated });
  } catch (error) {
    console.error("Cover upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/** DELETE ?url= — remove a cover URL from a product's images list. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = parseImages(product.images);
    if (!existing.includes(url)) {
      return NextResponse.json({ error: "Image not found on product" }, { status: 404 });
    }
    const next = existing.filter((u) => u !== url);
    const updated = await prisma.product.update({
      where: { id },
      data: { images: JSON.stringify(next) },
      include: { files: true },
    });

    // Best-effort cleanup of the stored file.
    if (url.startsWith("/products/covers/")) {
      const { deleteCoverImage } = await import("@/lib/storage");
      await deleteCoverImage(url.slice(1));
    } else if (url.startsWith("/api/blob-cover?path=")) {
      // Private-store cover: stored as a stable proxy URL — derive the blob
      // pathname from it and remove the blob (best effort).
      try {
        const pathname = decodeURIComponent(url.split("?path=")[1] || "");
        if (pathname.startsWith("covers/")) {
          const { del } = await import("@vercel/blob");
          await del(pathname);
        }
      } catch {
        // best effort
      }
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Cover delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
