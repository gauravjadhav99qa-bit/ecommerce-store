import { prisma } from "@/lib/prisma";
import { verifyReceipt } from "@/lib/receipt";

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

export async function loadOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
}

export function canAccessOrder(
  order: { id: string; userId: string | null; shippingEmail: string; paidAt: Date | null },
  viewer: { id?: string | null; email?: string | null } | null,
  receiptToken?: string | null
): boolean {
  if (!order.paidAt) return false;
  if (viewer?.id && viewer.id === order.userId) return true;
  if (
    viewer?.email &&
    order.shippingEmail &&
    viewer.email.toLowerCase() === order.shippingEmail.toLowerCase()
  ) {
    return true;
  }
  return verifyReceipt(order.id, receiptToken);
}

export async function getFilesForProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      productType: true,
      files: { orderBy: { sortOrder: "asc" } },
      bundleItems: { select: { product: { select: { files: { orderBy: { sortOrder: "asc" } } } } } },
    },
  });
  if (!product) return [];
  if (product.productType === "BUNDLE") {
    return product.bundleItems.flatMap((bi) => bi.product.files);
  }
  return product.files;
}

/**
 * Collect the cover-image URLs for a product (for on-demand PDF generation).
 * Bundles gather images from every contained product.
 */
export async function getImagesForProduct(productId: string): Promise<{ name: string; images: string[] }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      images: true,
      productType: true,
      bundleItems: {
        select: { product: { select: { name: true, images: true } } },
      },
    },
  });
  if (!product) return { name: "", images: [] };

  const parse = (raw: string): string[] => {
    try {
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr.filter((u) => typeof u === "string" && u) : [];
    } catch {
      return [];
    }
  };

  if (product.productType === "BUNDLE") {
    const images = product.bundleItems.flatMap((bi) => parse(bi.product.images));
    return { name: product.name, images };
  }
  return { name: product.name, images: parse(product.images) };
}
