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

// Keep in sync with NAMES in scripts/gen_mandalas.py (index 0..11).
const NAMES = [
  "Lotus Calm", "Starburst Bloom", "Sunwheel", "Petals & Dots",
  "Sacred Geometry", "Radiant Heart", "Moon Garden", "Zen Wheel",
  "Blossom Ring", "Crystal Bloom", "Harmony", "Tranquility",
];

const CATEGORY_NAME = "Mandala Coloring Pages";
const CATEGORY_SLUG = "mandala-coloring-pages";
const PRICE_PAISE = 4900; // ₹49.00
const OUT_DIR = path.join("scripts", "out_mandalas");
const PDF_DIR = path.join(OUT_DIR, "pdf");

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const DESCRIPTION = (name: string) =>
  `${name} — an original, hand-tuned mandala coloring page. High-resolution A4 PDF (300 DPI) ready to print at home. Bold, clean black outlines on crisp white; single-sided design with a wide center motif for easy coloring. Instant digital download; no physical item is shipped.`;

const PRINT_INSTRUCTIONS =
  "Print on A4 (or US Letter) at 100% / 'Actual size' — do not use 'Fit to page'. Best on single-sided paper. For best results use markers or gel pens.";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — check .env");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — check .env.local");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Category
    const category = await prisma.category.upsert({
      where: { slug: CATEGORY_SLUG },
      update: { name: CATEGORY_NAME },
      create: { name: CATEGORY_NAME, slug: CATEGORY_SLUG },
    });
    console.log(`Category ready: ${category.name} (${category.id})`);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < NAMES.length; i++) {
      const name = NAMES[i];
      const slug = `mandala-${slugify(name)}`;
      const pngPath = path.join(OUT_DIR, `mandala_${String(i + 1).padStart(2, "0")}.png`);
      // Generator names PDFs via name.lower().replace(' ', '-') — keeps '&'.
      const pdfPath = path.join(PDF_DIR, `${name.toLowerCase().replace(/ /g, "-")}.pdf`);

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        console.log(`  [skip] ${slug} already exists (${existing.id})`);
        skipped++;
        continue;
      }

      const png = await fs.readFile(pngPath);
      const pdf = await fs.readFile(pdfPath);

      // Create the product first so we have an id for the storage paths.
      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: DESCRIPTION(name),
          price: PRICE_PAISE,
          images: "[]",
          stock: 9999,
          isActive: true,
          featured: false,
          isDigital: true,
          productType: "SINGLE",
          categoryId: category.id,
          tags: JSON.stringify(["mandala", "coloring page", "printable", "digital download"]),
          pageCount: 1,
          paperSize: "A4",
          fileFormat: "PDF",
          printInstructions: PRINT_INSTRUCTIONS,
          license: "For personal use. Redistribution or resale of the file is not permitted.",
        },
      });

      // Cover -> private blob, stable /api/blob-cover URL stored in images.
      const cover = await putCoverImage({
        productId: product.id,
        fileName: `cover-${slugify(name)}.png`,
        data: png,
        mimeType: "image/png",
      });

      // A4 PDF -> private blob + ProductFile row.
      const file = await putProductFile({
        productId: product.id,
        fileName: `${slugify(name)}.pdf`,
        data: pdf,
        mimeType: "application/pdf",
      });
      await prisma.productFile.create({
        data: {
          productId: product.id,
          fileName: `${name}.pdf`,
          storagePath: file.storagePath,
          mimeType: "application/pdf",
          sizeBytes: file.sizeBytes,
          sortOrder: 0,
        },
      });

      // Persist the cover URL.
      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify([cover.url]) },
      });

      console.log(`  [ok]   ${name} -> ${product.id}`);
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
