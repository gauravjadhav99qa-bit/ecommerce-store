import { get } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

// A4 portrait in PDF points.
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 24;

/**
 * Resolve a stored cover image URL back to its blob/local storage path.
 * Private-store covers are stored as `/api/blob-cover?path=covers%2F...`.
 * Legacy local covers are `/products/covers/...`.
 */
function coverStoragePath(url: string): string | null {
  if (url.startsWith("/api/blob-cover")) {
    try {
      const u = new URL(url, "http://localhost");
      const p = u.searchParams.get("path");
      return p || null;
    } catch {
      return null;
    }
  }
  if (url.startsWith("/products/covers/")) {
    return url.slice(1); // strip leading slash for fs join
  }
  return null;
}

/** Fetch the raw bytes of a cover image (blob private store or local disk). */
async function fetchCoverBytes(url: string): Promise<Uint8Array | null> {
  const storagePath = coverStoragePath(url);
  if (!storagePath) return null;

  try {
    if (storagePath.startsWith("covers/")) {
      const result = (await get(storagePath, { access: "private" })) as {
        stream?: ReadableStream;
        blob?: { contentType?: string };
      };
      if (!result?.stream) return null;
      return await streamToUint8Array(result.stream);
    }
    // Local mode: read from public/products/covers/...
    const full = path.join(process.cwd(), "public", storagePath);
    const buf = await fs.readFile(full);
    return new Uint8Array(buf);
  } catch (err) {
    console.error("fetchCoverBytes error:", err);
    return null;
  }
}

async function streamToUint8Array(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function detectImageType(bytes: Uint8Array): "png" | "jpeg" | null {
  // PNG magic: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  // JPEG magic: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  return null;
}

/**
 * Build a single A4 PDF with one cover image per page.
 * Returns the PDF bytes, or null if no usable images were found.
 */
export async function buildProductPdf(
  imageUrls: string[],
  productName: string
): Promise<Uint8Array | null> {
  const usable = imageUrls.filter((u) => !!u);
  if (usable.length === 0) return null;

  const doc = await PDFDocument.create();
  doc.setTitle(productName);
  doc.setProducer("GT Shopping");
  doc.setCreator("GT Shopping");

  let pages = 0;
  for (const url of usable) {
    const bytes = await fetchCoverBytes(url);
    if (!bytes) continue;
    const kind = detectImageType(bytes);
    if (!kind) continue;

    let embedded;
    if (kind === "png") {
      embedded = await doc.embedPng(bytes);
    } else {
      embedded = await doc.embedJpg(bytes);
    }

    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    const maxWidth = A4_WIDTH - MARGIN * 2;
    const maxHeight = A4_HEIGHT - MARGIN * 2;
    const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height);
    const drawW = embedded.width * scale;
    const drawH = embedded.height * scale;
    page.drawImage(embedded, {
      x: (A4_WIDTH - drawW) / 2,
      y: (A4_HEIGHT - drawH) / 2,
      width: drawW,
      height: drawH,
    });
    pages++;
  }

  if (pages === 0) return null;
  return await doc.save();
}
