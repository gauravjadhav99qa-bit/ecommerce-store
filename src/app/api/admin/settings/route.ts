import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getSiteSettings, saveSiteSettings, DEFAULT_SETTINGS } from "@/lib/site-settings";

async function requireAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

/** GET /api/admin/settings — admin: full settings */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSiteSettings());
}

/** PUT /api/admin/settings — admin: save settings */
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const input: Record<string, string> = {};
  for (const k of allowed) {
    if (typeof b[k] === "string") input[k] = b[k] as string;
  }
  const saved = await saveSiteSettings(input);
  return NextResponse.json(saved);
}
