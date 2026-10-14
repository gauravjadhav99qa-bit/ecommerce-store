import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json(subscribers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}
