import dotenv from "dotenv";
// Load .env.local FIRST (real BLOB token) then .env (DATABASE_URL), no override.
dotenv.config({ path: ".env.local" });
dotenv.config();

import { promises as fs } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { putCoverImage, putProductFile } from "../src/lib/storage";

const API_BASE = "https://printablecoloringpages.ai/api";
const KEY = process.env.PRINTABLE_COLORING_PAGES_AI_API_KEY;
const CACHE_DIR = path.join("scripts", "out_pcp");
const PRICE_PAISE = 4900; // ₹49.00
const PAGES_PER_BOOK = 10;

type PcpFile = {
  pdf_a4?: string;
  png_a4_300?: string;
};
type PcpResult = {
  slug: string;
  title: string;
  subject: string;
  category: string;
  orientation: string;
  files: PcpFile;
  license?: string;
};

// Themed books. `category` is a valid printablecoloringpages.ai category slug.
const BOOKS: { key: string; name: string; category: string; catName: string; tags: string[] }[] = [
  { key: "animals", name: "Farm & Zoo Animals Coloring Book", category: "animals", catName: "Animal Coloring Books", tags: ["animals", "farm", "zoo", "kids", "coloring book"] },
  { key: "dinosaurs", name: "Dinosaur Coloring Book", category: "dinosaurs", catName: "Dinosaur Coloring Books", tags: ["dinosaurs", "jurassic", "kids", "coloring book"] },
  { key: "vehicles", name: "Cars & Vehicles Coloring Book", category: "vehicles", catName: "Vehicle Coloring Books", tags: ["cars", "trucks", "vehicles", "coloring book"] },
  { key: "ocean", name: "Ocean & Sea Life Coloring Book", category: "ocean", catName: "Ocean Coloring Books", tags: ["ocean", "fish", "sea", "marine", "coloring book"] },
  { key: "fantasy", name: "Fantasy & Magic Coloring Book", category: "fantasy", catName: "Fantasy Coloring Books", tags: ["fantasy", "unicorns", "dragons", "magic", "coloring book"] },
  { key: "nature", name: "Nature & Outdoors Coloring Book", category: "nature", catName: "Nature Coloring Books", tags: ["nature", "trees", "outdoors", "landscape", "coloring book"] },
  { key: "space", name: "Space & Rockets Coloring Book", category: "space", catName: "Space Coloring Books", tags: ["space", "rockets", "planets", "astronomy", "coloring book"] },
  { key: "food", name: "Fruits & Food Coloring Book", category: "food", catName: "Food Coloring Books", tags: ["fruits", "food", "healthy eating", "coloring book"] },
  { key: "mandalas", name: "Mandala Designs Coloring Book", category: "mandalas", catName: "Mandala Coloring Books", tags: ["mandala", "patterns", "relaxing", "adult", "coloring book"] },
];

const DESCRIPTION = (name: string, n: number) =>
  `${name} — a printable ${n}-page coloring book. Every page is high-resolution A4 (300 DPI), ready to print at home. Instant digital download; no physical item is shipped.`;

const PRINT_INSTRUCTIONS =
  "Print on A4 (or US Letter) at 100% / 'Actual size' — do not use 'Fit to page'. Best on single-sided paper. Crayons, markers or colored pencils all work great.";

const LICENSE_NOTE =
  "Artwork sourced from printablecoloringpages.ai and released under the Creative Commons CC0 1.0 public domain dedication. For personal or classroom use.";

async function apiSearch(category: string): Promise<PcpResult[]> {
  if (!KEY) throw new Error("PRINTABLE_COLORING_PAGES_AI_API_KEY missing — check .env");
  const url = `${API_BASE}/pages/search?category=${encodeURIComponent(category)}&per_page=30&key=${KEY}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`search ${category} -> HTTP ${res.status}`);
  const data = (await res.json()) as { results: PcpResult[] };
  return data.results ?? [];
}

// Pick portrait pages with unique subjects, up to `want`.
function pickPages(results: PcpResult[], want: number): PcpResult[] {
  const seen = new Set<string>();
  const out: PcpResult[] = [];
  for (const r of results) {
    if (r.orientation && r.orientation !== "portrait") continue;
    if (!r.files?.pdf_a4 || !r.files?.png_a4_300) continue;
    const subj = (r.subject || r.title || r.slug).toLowerCase().trim();
    if (seen.has(subj)) continue;
    seen.add(subj);
    out.push(r);
    if (out.length >= want) break;
  }
  return out;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Download with a local cache so re-runs are cheap and don't re-hit the CDN.
async function cached(relPath: string, url: string): Promise<Buffer> {
  const full = path.join(CACHE_DIR, ...relPath.split("/"));
  try {
    return await fs.readFile(full);
  } catch {
    /* miss */
  }
  const buf = await download(url);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return buf;
}

// Merge single-page provider PDFs into one multi-page PDF (lossless page copy).
async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf);
    const pages = await merged.copyPages(src, src.getPageIndices());
    for (const p of pages) merged.addPage(p);
  }
  merged.setProducer("GT Shopping");
  merged.setCreator("GT Shopping");
  return Buffer.from(await merged.save());
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing — check .env");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing — check .env.local");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // ---- 1. PURGE existing catalogue (0 products are locked by orders). ----
    const allProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
    console.log(`Purging ${allProducts.length} existing products...`);
    for (const p of allProducts) {
      await prisma.productFile.deleteMany({ where: { productId: p.id } });
      await prisma.bundleItem.deleteMany({ where: { OR: [{ productId: p.id }, { bundleId: p.id }] } });
      await prisma.variant.deleteMany({ where: { productId: p.id } });
      await prisma.product.delete({ where: { id: p.id } });
    }
    // Remove categories that now have no products.
    const emptied = await prisma.category.findMany({
      where: { products: { none: {} } },
      select: { id: true, slug: true },
    });
    if (emptied.length) {
      await prisma.category.deleteMany({ where: { id: { in: emptied.map((c) => c.id) } } });
    }
    console.log(`Purged ${allProducts.length} products, ${emptied.length} empty categories.`);

    // ---- 2. IMPORT themed books from the CC0 API. ----
    let created = 0;
    for (const book of BOOKS) {
      const results = await apiSearch(book.category);
      const pages = pickPages(results, PAGES_PER_BOOK);
      if (pages.length < PAGES_PER_BOOK) {
        console.warn(`  [warn] ${book.key}: only ${pages.length}/${PAGES_PER_BOOK} usable portrait pages`);
      }
      if (pages.length === 0) {
        console.warn(`  [skip] ${book.key}: no usable pages`);
        continue;
      }

      const productSlug = `${book.key}-coloring-book`;
      const category = await prisma.category.upsert({
        where: { slug: book.category },
        update: { name: book.catName },
        create: { name: book.catName, slug: book.category },
      });

      // Download all pages (cached) then merge their real PDFs.
      const pngs: Buffer[] = [];
      const pdfs: Buffer[] = [];
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const n = String(i + 1).padStart(2, "0");
        pngs.push(await cached(`${book.key}/${n}-${p.slug}.png`, p.files.png_a4_300!));
        pdfs.push(await cached(`${book.key}/${n}-${p.slug}.pdf`, p.files.pdf_a4!));
      }
      const mergedPdf = await mergePdfs(pdfs);

      const product = await prisma.product.create({
        data: {
          name: book.name,
          slug: productSlug,
          description: DESCRIPTION(book.name, pages.length),
          price: PRICE_PAISE,
          images: "[]",
          stock: 9999,
          isActive: true,
          featured: false,
          isDigital: true,
          productType: "SINGLE",
          categoryId: category.id,
          tags: JSON.stringify(book.tags),
          pageCount: pages.length,
          paperSize: "A4",
          fileFormat: "PDF",
          printInstructions: PRINT_INSTRUCTIONS,
          license: LICENSE_NOTE,
        },
      });

      // Upload every page image as a gallery entry.
      const imageUrls: string[] = [];
      for (let i = 0; i < pngs.length; i++) {
        const cover = await putCoverImage({
          productId: product.id,
          fileName: `${book.key}-${String(i + 1).padStart(2, "0")}.png`,
          data: pngs[i],
          mimeType: "image/png",
        });
        imageUrls.push(cover.url);
      }

      // Upload the merged multi-page PDF.
      const file = await putProductFile({
        productId: product.id,
        fileName: `${book.key}-coloring-book.pdf`,
        data: mergedPdf,
        mimeType: "application/pdf",
      });
      await prisma.productFile.create({
        data: {
          productId: product.id,
          fileName: `${book.name}.pdf`,
          storagePath: file.storagePath,
          mimeType: "application/pdf",
          sizeBytes: file.sizeBytes,
          sortOrder: 0,
        },
      });

      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(imageUrls) },
      });

      console.log(`  [ok]   ${book.name} -> ${pages.length} pages, ${imageUrls.length} images, PDF ${(mergedPdf.length / 1024).toFixed(0)}KB`);
      created++;
    }

    console.log(`\nDone. Created ${created} books.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
