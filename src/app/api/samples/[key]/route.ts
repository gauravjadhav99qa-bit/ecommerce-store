import { NextRequest, NextResponse } from "next/server";
import { COLOURING_KEYS, type ColouringKey } from "@/lib/colouring-pages";
import { buildDemoPdf } from "@/lib/demo-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: raw } = await params;
  const key = raw.replace(/\.pdf$/i, "") as ColouringKey;
  if (!COLOURING_KEYS.includes(key)) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  // pickPages(seed, 1)[0] === COLOURING_KEYS[(seed * 3) % len]
  // Find a seed that yields the requested key so page 2 is exactly it.
  const len = COLOURING_KEYS.length;
  let seed = 0;
  for (let s = 0; s < len * 3; s++) {
    if (COLOURING_KEYS[(s * 3) % len] === key) {
      seed = s;
      break;
    }
  }

  const pdf = buildDemoPdf({
    title: "Free colouring page",
    subtitle: "GT Shopping · print at 100% on A4 or US Letter",
    pageCount: 2,
    demo: false,
    seedIndex: seed,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gt-shopping-${key}.pdf"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
