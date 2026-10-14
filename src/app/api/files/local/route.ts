import { NextRequest, NextResponse } from "next/server";
import {
  getStorageMode,
  readProductFile,
  verifyLocalSignedPath,
} from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (getStorageMode() !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storagePath = req.nextUrl.searchParams.get("path") || "";
  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") || "";

  if (!storagePath || !storagePath.startsWith("products/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!verifyLocalSignedPath(storagePath, exp, sig)) {
    return NextResponse.json({ error: "Link expired" }, { status: 403 });
  }

  const file = await readProductFile(storagePath);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileName = storagePath.split("/").pop() || "download.pdf";
  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
