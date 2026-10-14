import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { z } from "zod";

async function requireAdmin(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  price: z.number().positive(),
  compareAt: z.number().positive().nullable().optional(),
  images: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  productType: z.enum(["SINGLE", "BUNDLE"]).optional(),
  tags: z.string().max(1000).optional(),
  pageCount: z.number().int().positive().nullable().optional(),
  paperSize: z.string().max(50).nullable().optional(),
  fileFormat: z.string().max(20).nullable().optional(),
  printInstructions: z.string().max(2000).nullable().optional(),
  license: z.string().max(2000).nullable().optional(),
  bundleItemIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        files: { orderBy: { sortOrder: "asc" } },
        bundleItems: {
          include: { product: { select: { id: true, name: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }
    const data = parsed.data;
    const { bundleItemIds, ...rest } = data;

    const slug = rest.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const product = await prisma.product.create({
      data: {
        name: rest.name,
        slug: `${slug}-${Date.now()}`,
        description: rest.description ?? null,
        price: Math.round(rest.price * 100),
        compareAt: rest.compareAt ? Math.round(rest.compareAt * 100) : null,
        images: rest.images || "[]",
        stock: rest.isDigital === false ? (rest.stock || 0) : 9999,
        sku: rest.sku ?? null,
        categoryId: rest.categoryId ?? null,
        featured: rest.featured || false,
        isActive: rest.isActive !== false,
        isDigital: rest.isDigital !== false,
        productType: rest.productType || (bundleItemIds?.length ? "BUNDLE" : "SINGLE"),
        tags: rest.tags || "[]",
        pageCount: rest.pageCount ?? null,
        paperSize: rest.paperSize ?? null,
        fileFormat: rest.fileFormat || (rest.isDigital === false ? null : "PDF"),
        printInstructions: rest.printInstructions ?? null,
        license: rest.license ?? null,
        ...(bundleItemIds?.length
          ? {
              bundleItems: {
                create: bundleItemIds.map((pid, idx) => ({
                  productId: pid,
                  sortOrder: idx,
                })),
              },
            }
          : {}),
      },
      include: { files: true, bundleItems: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // Partial update: only fields present in the body are changed.
    const parsed = productSchema
      .partial()
      .extend({ id: z.string().min(1) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }
    const { id, bundleItemIds, price, compareAt, ...rest } = parsed.data;

    // Strip undefined so Prisma leaves those columns untouched.
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) data[k] = v;
    }
    if (price !== undefined) data.price = Math.round(price * 100);
    if (compareAt !== undefined) {
      data.compareAt = compareAt ? Math.round(compareAt * 100) : null;
    }

    if (rest.productType && rest.productType !== "BUNDLE") {
      // Switching away from bundle clears its items.
      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
    }

    if (bundleItemIds) {
      data.bundleItems = {
        deleteMany: {},
        create: bundleItemIds.map((pid, idx) => ({
          productId: pid,
          sortOrder: idx,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { files: true, bundleItems: { include: { product: { select: { id: true, name: true } } } } },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      // Keep history intact: unpublish instead of delete.
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        success: true,
        unpublished: true,
        message: "Product has orders — it was unpublished instead of deleted.",
      });
    }

    await prisma.bundleItem.deleteMany({
      where: { OR: [{ bundleId: id }, { productId: id }] },
    });
    await prisma.productFile.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
