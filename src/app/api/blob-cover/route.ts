import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { getStorageMode } from "@/lib/storage";

// Keep signed URLs short-lived so a copied URL stops working quickly.
const SIGN_TTL_MS = 60 * 60 * 1000;

/**
 * GET — serves private cover images by redirecting to a freshly signed Blob
 * URL. The product images list stores stable /api/blob-cover?path=... URLs;
 * this keeps every <img> working without persisting expiring signatures.
 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "";
  // Only cover blobs are served through this proxy.
  if (!path.startsWith("covers/") || path.includes("..") || path.includes("//")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (getStorageMode() !== "blob") {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 404 });
  }

  try {
    const validUntil = Date.now() + SIGN_TTL_MS;
    const token = await issueSignedToken({
      pathname: path,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname: path,
      operation: "get",
      access: "private",
      validUntil,
    });
    return NextResponse.redirect(presignedUrl, {
      status: 302,
      // Match the short signed-URL TTL so stale redirects expire quickly.
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  } catch (error) {
    console.error("Cover sign error:", error);
    return NextResponse.json({ error: "Failed to sign cover URL" }, { status: 500 });
  }
}
