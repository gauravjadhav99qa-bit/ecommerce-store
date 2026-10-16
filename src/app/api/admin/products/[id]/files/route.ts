import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { putProductFile, ALLOWED_MIME_TYPES, getStorageMode, sanitizeFileName } from "@/lib/storage";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { randomUUID } from "crypto";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

async function requireAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/**
 * POST — upload a PDF/ZIP file for a product.
 *
 * Two modes:
 *  - JSON {mode:"init"}    → returns a short-lived client token so the browser
 *                            uploads LARGE files straight to Blob, bypassing
 *                            Vercel's ~4.5MB serverless request-body limit.
 *  - JSON {mode:"commit"}  → records a direct upload in the database.
 *  - multipart/form-data   → legacy in-route upload (local mode / small files).
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

    const contentType = req.headers.get("content-type") || "";

    // ---- Direct-upload init / commit (JSON) ----
    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (body?.mode === "init") {
        const fileName = sanitizeFileName(String(body.fileName || "file.pdf"));
        const mimeType = String(body.mimeType || "application/pdf");
        const sizeBytes = Number(body.sizeBytes || 0);

        if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
          return NextResponse.json(
            { error: "Only PDF and ZIP files are allowed" },
            { status: 400 }
          );
        }
        if (sizeBytes > MAX_SIZE) {
          return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
        }
        if (getStorageMode() !== "blob") {
          return NextResponse.json({ mode: "form" });
        }

        const storagePath = `products/${id}/${randomUUID()}-${fileName}`;
        const token = await generateClientTokenFromReadWriteToken({
          pathname: storagePath,
          allowedContentTypes: [...ALLOWED_MIME_TYPES] as string[],
        });
        return NextResponse.json({ mode: "direct", token, pathname: storagePath });
      }

      if (body?.mode === "commit") {
        const storagePath = String(body.storagePath || "");
        const fileName = String(body.fileName || "");
        const mimeType = String(body.mimeType || "application/pdf");
        const sizeBytes = Number(body.sizeBytes || 0);

        // The recorded path must belong to this product's folder.
        if (!storagePath.startsWith(`products/${id}/`)) {
          return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
        }
        if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
          return NextResponse.json(
            { error: "Only PDF and ZIP files are allowed" },
            { status: 400 }
          );
        }
        if (sizeBytes > MAX_SIZE) {
          return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
        }

        const count = await prisma.productFile.count({ where: { productId: id } });
        const row = await prisma.productFile.create({
          data: {
            productId: id,
            fileName,
            storagePath,
            mimeType: mimeType as "application/pdf" | "application/zip",
            sizeBytes,
            sortOrder: count,
          },
        });
        return NextResponse.json(row);
      }

      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // ---- Legacy multipart upload ----
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }
    const mimeType = file.type || "application/pdf";
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return NextResponse.json(
        { error: "Only PDF and ZIP files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await putProductFile({
      productId: product.id,
      fileName: file.name,
      data: buffer,
      mimeType: mimeType as "application/pdf" | "application/zip",
    });

    const count = await prisma.productFile.count({ where: { productId: id } });
    const row = await prisma.productFile.create({
      data: {
        productId: id,
        fileName: file.name,
        storagePath: stored.storagePath,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        sortOrder: count,
      },
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const fileId = req.nextUrl.searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    const file = await prisma.productFile.findUnique({ where: { id: fileId } });
    if (!file || file.productId !== id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { deleteProductFile } = await import("@/lib/storage");
    await deleteProductFile(file.storagePath);
    await prisma.productFile.delete({ where: { id: fileId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
