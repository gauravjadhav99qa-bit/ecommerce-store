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
const MANIFEST = path.join("scripts", "out_pcp", "manifest.json");
const PLAN = path.join("scripts", "out_pcp", "book-plan.json");
const CACHE_DIR = path.join("scripts", "out_pcp", "files");

const PRICE_PAISE = 4900; // ₹49.00
const DL_DELAY_MS = 120;  // throttle between CDN downloads

type PcpResult = {
  slug: string; title: string; subject: string; category: string;
  topic?: string; age_band?: string; difficulty?: number; orientation?: string;
  license?: string;
  files: { pdf_a4?: string; png_a4_300?: string };
};
type Book = {
  key: string; name: string; category: string; catName: string;
  kind: "themed" | "variety"; pageSlugs: string[]; pageCount: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DESCRIPTION = (name: string, n: number) =>
  `${name} — a printable ${n}-page coloring book. Every page is high-resolution A4 (300 DPI), ready to print at home. Instant digital download; no physical item is shipped.`;

const PRINT_INSTRUCTIONS =
  "Print on A4 (or US Letter) at 100% / 'Actual size' — do not use 'Fit to page'. Best on single-sided paper. Crayons, markers or colored pencils all work great.";

const LICENSE_NOTE =
  "Released under the Creative Commons CC0 1.0 public domain dedication. For personal or classroom use.";

// Themed books describe their topic; variety books describe the category.
function bookDescription(book: Book, n: number): string {
  if (book.kind === "themed") return DESCRIPTION(book.name, n);
  return DESCRIPTION(`${book.name} (${book.catName})`, n);
}

function bookTags(book: Book, pages: PcpResult[]): string[] {
  const tags = new Set<string>(["coloring book", "printable", "kids"]);
  tags.add(book.catName.toLowerCase());
  if (book.kind === "themed") {
    // Topic words from the book name, e.g. "Farm Animals" -> farm, animals
    for (const w of book.name.toLowerCase().replace(/ coloring book.*/, "").split(/[\s&]+/)) {
      if (w.length > 2) tags.add(w);
    }
  }
  return [...tags].slice(0, 10);
}

async function download(url: string, attempts = 4): Promise<Buffer> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err as Error;
      if (i < attempts - 1) await sleep(1000 * 2 ** i); // 1s, 2s, 4s
    }
  }
  throw lastErr || new Error("download failed");
}

// Disk cache keyed by page slug so re-runs never re-download.
async function cached(pageSlug: string, kind: "png" | "pdf", url: string): Promise<Buffer> {
  const full = path.join(CACHE_DIR, kind, `${pageSlug}.${kind}`);
  try {
    return await fs.readFile(full);
  } catch {
    /* miss */
  }
  const buf = await download(url);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  await sleep(DL_DELAY_MS);
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

async function purgeAll(prisma: PrismaClient) {
  const all = await prisma.product.findMany({ select: { id: true } });
  console.log(`Purging ${all.length} existing products...`);
  for (const p of all) {
    await prisma.productFile.deleteMany({ where: { productId: p.id } });
    await prisma.bundleItem.deleteMany({ where: { OR: [{ productId: p.id }, { bundleId: p.id }] } });
    await prisma.variant.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
  }
  const emptied = await prisma.category.findMany({ where: { products: { none: {} } }, select: { id: true } });
  if (emptied.length) await prisma.category.deleteMany({ where: { id: { in: emptied.map((c) => c.id) } } });
  console.log(`Purged ${all.length} products, ${emptied.length} empty categories.`);
}

async function importBook(
  prisma: PrismaClient,
  book: Book,
  bySlug: Map<string, PcpResult>
) {
  const productSlug = `${book.key}`;
  const existing = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: { files: true },
  });
  if (existing) {
    // Self-heal: a prior run may have crashed after creating the row but
    // before uploading covers/PDF, leaving an empty shell. Delete and redo.
    let imgs: string[] = [];
    try { imgs = JSON.parse(existing.images); } catch { /* treat as empty */ }
    const partial = imgs.length === 0 || existing.files.length === 0;
    if (partial) {
      console.log(`  [heal] ${productSlug} was partial (img=${imgs.length} files=${existing.files.length}), redoing`);
      await prisma.productFile.deleteMany({ where: { productId: existing.id } });
      await prisma.bundleItem.deleteMany({ where: { OR: [{ productId: existing.id }, { bundleId: existing.id }] } });
      await prisma.variant.deleteMany({ where: { productId: existing.id } });
      await prisma.product.delete({ where: { id: existing.id } });
    } else {
      console.log(`  [skip] ${productSlug}`);
      return "skipped";
    }
  }

  // Resolve pages from the manifest. Drop any that vanished.
  const pages: PcpResult[] = [];
  for (const s of book.pageSlugs) {
    const p = bySlug.get(s);
    if (p?.files?.pdf_a4 && p?.files?.png_a4_300) pages.push(p);
  }
  if (pages.length === 0) {
    console.warn(`  [warn] ${productSlug}: no usable pages, skipping`);
    return "failed";
  }

  // Download (cached) then merge.
  const pngs: Buffer[] = [];
  const pdfs: Buffer[] = [];
  for (const p of pages) {
    pngs.push(await cached(p.slug, "png", p.files.png_a4_300!));
    pdfs.push(await cached(p.slug, "pdf", p.files.pdf_a4!));
  }
  const mergedPdf = await mergePdfs(pdfs);

  const category = await prisma.category.upsert({
    where: { slug: book.category },
    update: { name: book.catName },
    create: { name: book.catName, slug: book.category },
  });

  const product = await prisma.product.create({
    data: {
      name: book.name,
      slug: productSlug,
      description: bookDescription(book, pages.length),
      price: PRICE_PAISE,
      images: "[]",
      stock: 9999,
      isActive: true,
      featured: false,
      isDigital: true,
      productType: "SINGLE",
      categoryId: category.id,
      tags: JSON.stringify(bookTags(book, pages)),
      pageCount: pages.length,
      paperSize: "A4",
      fileFormat: "PDF",
      printInstructions: PRINT_INSTRUCTIONS,
      license: LICENSE_NOTE,
    },
  });

  // Upload covers with per-file retry: Vercel Blob can throw a transient
  // "already exists" even though randomUUID makes paths unique. Retrying with
  // a fresh filename sidesteps any edge case.
  const imageUrls: string[] = [];
  for (let i = 0; i < pngs.length; i++) {
    const baseName = `${book.key}-${String(i + 1).padStart(2, "0")}`;
    let cover: { url: string } | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        cover = await putCoverImage({
          productId: product.id,
          fileName: attempt === 1 ? `${baseName}.png` : `${baseName}-r${attempt}.png`,
          data: pngs[i],
          mimeType: "image/png",
        });
        break;
      } catch (err) {
        if (attempt < 3) {
          console.log(`\n    [retry cover ${i + 1}/${pngs.length} a${attempt}] ${(err as Error).message.slice(0, 60)}`);
          await sleep(1000 * attempt);
        } else {
          throw err;
        }
      }
    }
    if (cover) imageUrls.push(cover.url);
  }

  const file = await putProductFile({
    productId: product.id,
    fileName: `${book.key}.pdf`,
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

  await prisma.product.update({ where: { id: product.id }, data: { images: JSON.stringify(imageUrls) } });
  console.log(`  [ok]   ${book.name} -> ${pages.length}pp, ${imageUrls.length}img, PDF ${(mergedPdf.length / 1024).toFixed(0)}KB`);
  return "created";
}

async function main() {
  const purge = process.argv.includes("--purge");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing — check .env");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing — check .env.local");
  if (!KEY) throw new Error("PRINTABLE_COLORING_PAGES_AI_API_KEY missing — check .env");

  const manifest: Record<string, PcpResult[]> = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const bySlug = new Map<string, PcpResult>();
  for (const arr of Object.values(manifest)) for (const p of arr) bySlug.set(p.slug, p);

  const books: Book[] = JSON.parse(await fs.readFile(PLAN, "utf8"));
  console.log(`Plan: ${books.length} books, ${books.reduce((n, b) => n + b.pageCount, 0)} pages.`);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  let prisma = new PrismaClient({ adapter });

  // Neon serverless drops idle connections on long runs. On a DB error,
  // rebuild the client and retry the book a couple of times.
  const isConnErr = (e: unknown): boolean => {
    const m = String((e as Error)?.message || e).toLowerCase();
    return (
      m.includes("can't reach database") ||
      m.includes("can't reach") ||
      m.includes("connection") ||
      m.includes("econnreset") ||
      m.includes("econnrefused") ||
      m.includes("timeout") ||
      m.includes("terminated") ||
      m.includes("p1017") ||
      m.includes("server has closed")
    );
  };

  async function reconnect() {
    try { await prisma.$disconnect(); } catch { /* ignore */ }
    const a = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    prisma = new PrismaClient({ adapter: a });
    await prisma.$connect();
  }

  async function importWithRetry(book: Book): Promise<"created" | "skipped" | "failed"> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await importBook(prisma, book, bySlug);
      } catch (err) {
        if (attempt < 3 && isConnErr(err)) {
          console.log(`\n    [retry ${attempt}] connection error, reconnecting...`);
          await sleep(2000 * attempt);
          await reconnect();
          continue;
        }
        throw err;
      }
    }
    return "failed";
  }

  try {
    if (purge) await purgeAll(prisma);

    let created = 0, skipped = 0, failed = 0;
    const started = Date.now();
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      process.stdout.write(`[${i + 1}/${books.length}] ${book.name} ... `);
      try {
        const r = await importWithRetry(book);
        if (r === "created") created++;
        else if (r === "skipped") skipped++;
        else failed++;
      } catch (err) {
        failed++;
        console.error(`\n    ERR: ${(err as Error).message}`);
      }
      const mins = ((Date.now() - started) / 60000).toFixed(1);
      if ((i + 1) % 10 === 0) console.log(`  ... progress ${i + 1}/${books.length} (${mins}m) | ok=${created} skip=${skipped} fail=${failed}`);
    }

    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`\nDone in ${mins}m. created=${created} skipped=${skipped} failed=${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
