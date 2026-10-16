import dotenv from "dotenv";
// Load .env.local FIRST (real BLOB token) then .env (DATABASE_URL), no override.
// .env declares an empty BLOB_READ_WRITE_TOKEN, so it must not win.
dotenv.config({ path: ".env.local" });
dotenv.config();

import { promises as fs } from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { putCoverImage, putProductFile } from "../src/lib/storage";

// Must match PAGES order in scripts/gen_kids.py (index 0..).
const ITEMS: { slug: string; title: string }[] = [
  { slug: "sun", title: "Happy Sun" },
  { slug: "house", title: "My House" },
  { slug: "cat", title: "Cute Cat" },
  { slug: "butterfly", title: "Butterfly" },
  { slug: "fish", title: "Little Fish" },
  { slug: "flower", title: "Big Flower" },
  { slug: "car", title: "My Car" },
  { slug: "rocket", title: "Space Rocket" },
  { slug: "tree", title: "Apple Tree" },
  { slug: "heart", title: "Love Heart" },
  { slug: "star", title: "Twinkle Star" },
  { slug: "duck", title: "Duckling" },
  { slug: "apple", title: "Yummy Apple" },
];

const CATEGORY_NAME = "Kids Coloring Pages";
const CATEGORY_SLUG = "kids-coloring-pages";
const PRICE_PAISE = 4900; // ₹49.00
const OUT_DIR = path.join("scripts", "out_kids");
const PDF_DIR = path.join(OUT_DIR, "pdf");

const DESCRIPTION = (title: string) =>
  `${title} — an original, easy kids coloring page with extra-thick outlines. Big simple shapes that little hands can color without frustration. High-resolution A4 PDF (300 DPI), ready to print at home. Instant digital download; no physical item is shipped.`;

const PRINT_INSTRUCTIONS =
  "Print on A4 (or US Letter) at 100% / 'Actual size' — do not use 'Fit to page'. Best on single-sided paper. Crayons, markers or colored pencils all work great.";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing — check .env");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing — check .env.local");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: { name: CATEGORY_NAME },
      create: { name: CATEGORY_NAME, slug: CATEGORY_SLUG },
    });
    console.log(`Category ready: ${category.name} (${category.id})`);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < ITEMS.length; i++) {
      const { slug: itemSlug, title } = ITEMS[i];
      const productSlug = `kids-${itemSlug}`;
      const pngPath = path.join(OUT_DIR, `kids_${String(i + 1).padStart(2, "0")}_${itemSlug}.png`);
      const pdfPath = path.join(PDF_DIR, `${itemSlug}.pdf`);

      const existing = await prisma.product.findUnique({ where: { slug: productSlug } });
      if (existing) {
        console.log(`  [skip] ${productSlug} (${existing.id})`);
        skipped++;
        continue;
      }

      const png = await fs.readFile(pngPath);
      const pdf = await fs.readFile(pdfPath);

      const product = await prisma.product.create({
        data: {
          name: title,
          slug: productSlug,
          description: DESCRIPTION(title),
          price: PRICE_PAISE,
          images: "[]",
          stock: 9999,
          isActive: true,
          featured: false,
          isDigital: true,
          productType: "SINGLE",
          categoryId: category.id,
          tags: JSON.stringify(["kids", "coloring page", "printable", "toddlers", "preschool"]),
          pageCount: 1,
          paperSize: "A4",
          fileFormat: "PDF",
          printInstructions: PRINT_INSTRUCTIONS,
          license: "For personal or classroom use. Redistribution or resale of the file is not permitted.",
        },
      });

      const cover = await putCoverImage({
        productId: product.id,
        fileName: `cover-${itemSlug}.png`,
        data: png,
        mimeType: "image/png",
      });

      const file = await putProductFile({
        productId: product.id,
        fileName: `${itemSlug}.pdf`,
        data: pdf,
        mimeType: "application/pdf",
      });
      await prisma.productFile.create({
        data: {
          productId: product.id,
          fileName: `${title}.pdf`,
          storagePath: file.storagePath,
          mimeType: "application/pdf",
          sizeBytes: file.sizeBytes,
          sortOrder: 0,
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify([cover.url]) },
      });

      console.log(`  [ok]   ${title} -> ${product.id}`);
      created++;
    }

    console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
