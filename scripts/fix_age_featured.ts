import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { promises as fs } from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const MANIFEST = path.join("scripts", "out_pcp", "manifest.json");
const PLAN = path.join("scripts", "out_pcp", "book-plan.json");

type PcpResult = { slug: string; age_band?: string };
type Book = { key: string; category: string; pageSlugs: string[]; pageCount: number };

const BAND_TAG: Record<string, string> = {
  "2-4": "age:2-4",
  "5-8": "age:5-8",
  "9-12": "age:9-12",
  "13+": "age:13+",
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

  const manifest: Record<string, PcpResult[]> = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const bySlug = new Map<string, PcpResult>();
  for (const arr of Object.values(manifest)) for (const p of arr) bySlug.set(p.slug, p);

  const books: Book[] = JSON.parse(await fs.readFile(PLAN, "utf8"));
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let tagged = 0, featured = 0;

  // Pick one featured book per category: the largest themed book (most pages).
  const bestPerCat = new Map<string, Book>();
  for (const b of books) {
    const cur = bestPerCat.get(b.category);
    if (!cur || b.pageCount > cur.pageCount) bestPerCat.set(b.category, b);
  }
  const featuredKeys = new Set([...bestPerCat.values()].map((b) => b.key));

  for (const book of books) {
    const product = await prisma.product.findUnique({ where: { slug: book.key } });
    if (!product) continue;

    const counts: Record<string, number> = {};
    for (const s of book.pageSlugs) {
      const band = bySlug.get(s)?.age_band;
      if (band && BAND_TAG[band]) counts[band] = (counts[band] || 0) + 1;
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

    let tags: string[] = [];
    try { tags = JSON.parse(product.tags || "[]"); } catch { /* reset */ }
    tags = tags.filter((t) => !t.startsWith("age:"));
    // Tag every band present in the book (up to 2) so mixed books still match.
    const bands = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
    for (const band of bands.length ? bands : dominant ? [dominant] : []) {
      tags.push(BAND_TAG[band]);
    }

    const isFeatured = featuredKeys.has(book.key);
    await prisma.product.update({
      where: { id: product.id },
      data: { tags: JSON.stringify(tags), featured: isFeatured },
    });
    tagged++;
    if (isFeatured) featured++;
  }

  console.log(`Tagged ${tagged} products with age bands; featured=${featured} (one per category).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
