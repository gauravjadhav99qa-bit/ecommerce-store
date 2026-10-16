import { createHmac, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { get, issueSignedToken, presignUrl, put } from "@vercel/blob";

export type StorageMode = "blob" | "local";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/zip",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const LOCAL_FILES_DIR = path.join(process.cwd(), "data", "files");
const LOCAL_DOWNLOAD_TTL_MS = 15 * 60 * 1000;

export function getStorageMode(): StorageMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL && process.env.BLOB_STORE_ID) return "blob";
  return "local";
}

function assertAllowedMime(mimeType: string): asserts mimeType is AllowedMimeType {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() || "file";
  return base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 120);
}

export async function putProductFile(opts: {
  productId: string;
  fileName: string;
  data: Buffer;
  mimeType: AllowedMimeType;
}): Promise<{ storagePath: string; sizeBytes: number; mimeType: AllowedMimeType }> {
  const { productId, data, mimeType } = opts;
  assertAllowedMime(mimeType);

  const safeName = sanitizeFileName(opts.fileName);
  const storagePath = `products/${productId}/${randomUUID()}-${safeName}`;

  if (getStorageMode() === "blob") {
    await put(storagePath, data, {
      access: "private",
      contentType: mimeType,
      allowOverwrite: false,
    });
  } else {
    const fullPath = path.join(LOCAL_FILES_DIR, ...storagePath.split("/"));
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  return { storagePath, sizeBytes: data.byteLength, mimeType };
}

export const ALLOWED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;

export type AllowedCoverMimeType = (typeof ALLOWED_COVER_MIME_TYPES)[number];

const PUBLIC_COVERS_DIR = path.join(process.cwd(), "public", "products", "covers");

/** Store a public catalogue cover (served directly by the site). */
export async function putCoverImage(opts: {
  productId: string;
  fileName: string;
  data: Buffer;
  mimeType: AllowedCoverMimeType;
}): Promise<{ url: string; storagePath: string }> {
  const safeName = sanitizeFileName(opts.fileName);
  const fileName = `${randomUUID()}-${safeName}`;

  if (getStorageMode() === "blob") {
    const storagePath = `covers/${opts.productId}/${fileName}`;
    // The connected Blob store is PRIVATE, so the cover is stored privately
    // and surfaced via a long-lived signed URL that can be dropped straight
    // into an <img src> (the images list stores plain URLs).
    await put(storagePath, opts.data, {
      access: "private",
      contentType: opts.mimeType,
      allowOverwrite: false,
    });
    const validUntil = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
    const token = await issueSignedToken({
      pathname: storagePath,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname: storagePath,
      operation: "get",
      access: "private",
      validUntil,
    });
    return { url: presignedUrl, storagePath };
  }

  // Local: write under public/ so Next serves it at /products/covers/...
  const rel = path.posix.join("products", "covers", opts.productId, fileName);
  const fullPath = path.join(process.cwd(), "public", rel);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, opts.data);
  return { url: `/${rel}`, storagePath: rel };
}

/** Delete a cover previously stored via putCoverImage (local only best-effort). */
export async function deleteCoverImage(storagePath: string): Promise<void> {
  if (storagePath.startsWith("http")) return;
  if (getStorageMode() === "blob") {
    try {
      const { del } = await import("@vercel/blob");
      await del(storagePath);
    } catch {
      // best effort
    }
    return;
  }
  const fullPath = path.join(process.cwd(), "public", storagePath);
  if (!fullPath.startsWith(PUBLIC_COVERS_DIR) && !fullPath.startsWith(path.join(process.cwd(), "public"))) {
    return;
  }
  try {
    await fs.unlink(fullPath);
  } catch {
    // best effort
  }
}

export function signLocalPath(storagePath: string, expiresAt: number): string {
  const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret")
    .update(`${storagePath}|${expiresAt}`)
    .digest("hex");
  const params = new URLSearchParams({
    path: storagePath,
    exp: String(expiresAt),
    sig,
  });
  return `/api/files/local?${params.toString()}`;
}

export function verifyLocalSignedPath(
  storagePath: string,
  expiresAt: number,
  sig: string
): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret")
    .update(`${storagePath}|${expiresAt}`)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && a.equals(b);
  } catch {
    return false;
  }
}

export async function issueProductDownload(opts: {
  storagePath: string;
  ttlMs?: number;
}): Promise<string> {
  const ttl = opts.ttlMs ?? LOCAL_DOWNLOAD_TTL_MS;
  const validUntil = Date.now() + ttl;

  if (getStorageMode() === "blob") {
    const token = await issueSignedToken({
      pathname: opts.storagePath,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname: opts.storagePath,
      operation: "get",
      access: "private",
      validUntil,
    });
    return presignedUrl;
  }

  return signLocalPath(opts.storagePath, validUntil);
}

export async function getCoverImageUrl(
  storagePath: string,
  ttlMs = 60 * 60 * 1000
): Promise<string> {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  return issueProductDownload({ storagePath, ttlMs });
}

export async function readProductFile(
  storagePath: string
): Promise<{ stream: ReadableStream; contentType: string } | null> {
  if (getStorageMode() === "blob") {
    const result: any = await get(storagePath, { access: "private" });
    if (!result?.stream) return null;
    const contentType =
      result.blob?.contentType ||
      result.headers?.get?.("content-type") ||
      "application/pdf";
    return {
      stream: result.stream as ReadableStream,
      contentType,
    };
  }

  const fullPath = path.join(LOCAL_FILES_DIR, ...storagePath.split("/"));
  if (!fullPath.startsWith(LOCAL_FILES_DIR)) return null;
  try {
    await fs.access(fullPath);
  } catch {
    return null;
  }

  const { createReadStream } = await import("fs");
  const nodeStream = createReadStream(fullPath);
  const stream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
  const ext = path.extname(fullPath).toLowerCase();
  const contentType =
    ext === ".zip" ? "application/zip" : "application/pdf";
  return { stream, contentType };
}

export async function deleteProductFile(storagePath: string): Promise<void> {
  if (storagePath.startsWith("http")) return;
  if (getStorageMode() === "blob") {
    try {
      const { del } = await import("@vercel/blob");
      await del(storagePath);
    } catch {
      // best effort
    }
    return;
  }
  const fullPath = path.join(LOCAL_FILES_DIR, ...storagePath.split("/"));
  if (!fullPath.startsWith(LOCAL_FILES_DIR)) return;
  try {
    await fs.unlink(fullPath);
  } catch {
    // best effort
  }
}
