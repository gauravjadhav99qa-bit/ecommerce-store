import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { products: { some: { isActive: true, isDigital: true } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    });
    return NextResponse.json(categories, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
