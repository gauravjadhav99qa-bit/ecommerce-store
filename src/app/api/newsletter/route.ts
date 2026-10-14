import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  source: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, source: parsed.data.source || "footer" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
