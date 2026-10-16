import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Keep the CC0 legal statement (accurate) but drop the provider's name.
const CLEAN_LICENSE =
  "Released under the Creative Commons CC0 1.0 public domain dedication. For personal or classroom use.";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    // 1. license field: replace any provider mention with the clean text.
    const byLicense = await prisma.product.updateMany({
      where: { license: { contains: "printablecoloringpages", mode: "insensitive" } },
      data: { license: CLEAN_LICENSE },
    });
    console.log(`license cleaned on ${byLicense.count} products`);

    // 2. description: strip any provider mention if present (keep rest of text).
    const descs = await prisma.product.findMany({
      where: { description: { contains: "printablecoloringpages", mode: "insensitive" } },
      select: { id: true, description: true },
    });
    for (const d of descs) {
      const cleaned = (d.description || "")
        .replace(/\s*sourced from printablecoloringpages\.ai[.]?/gi, "")
        .replace(/\s*from printablecoloringpages\.ai[.]?/gi, "")
        .replace(/printablecoloringpages\.ai/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      await prisma.product.update({ where: { id: d.id }, data: { description: cleaned } });
    }
    console.log(`description cleaned on ${descs.length} products`);

    // 3. printInstructions + tags: same sweep.
    const byInstr = await prisma.product.updateMany({
      where: { printInstructions: { contains: "printablecoloringpages", mode: "insensitive" } },
      data: { printInstructions: "Print on A4 (or US Letter) at 100% / 'Actual size' — do not use 'Fit to page'. Best on single-sided paper. Crayons, markers or colored pencils all work great." },
    });
    console.log(`printInstructions cleaned on ${byInstr.count} products`);

    // 4. Verify zero references remain anywhere on Product.
    const remaining = await prisma.product.count({
      where: {
        OR: [
          { license: { contains: "printablecoloringpages", mode: "insensitive" } },
          { description: { contains: "printablecoloringpages", mode: "insensitive" } },
          { printInstructions: { contains: "printablecoloringpages", mode: "insensitive" } },
          { name: { contains: "printablecoloringpages", mode: "insensitive" } },
          { tags: { contains: "printablecoloringpages", mode: "insensitive" } },
        ],
      },
    });
    console.log(`remaining provider references in products: ${remaining}`);

    const total = await prisma.product.count();
    console.log(`total products: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
