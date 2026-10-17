import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { promises as fs } from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { putCoverImage } from "../src/lib/storage";

const PLAN = path.join("scripts", "out_pcp", "book-plan.json");
const PNG_DIR = path.join("scripts", "out_pcp", "files", "png");
const OUT_DIR = path.join("scripts", "out_pcp", "covers");

const W = 1280;
const H = 1600;

type Book = {
  key: string; name: string; category: string; catName: string;
  kind: "themed" | "variety"; pageSlugs: string[]; pageCount: number;
};

const CAT_STYLE: Record<string, { bg: string; accent: string }> = {
  animals: { bg: "#E8F5E9", accent: "#5E8C3A" },
  sports: { bg: "#E3F2FD", accent: "#1565C0" },
  "world-cultures": { bg: "#FBE9E7", accent: "#D84315" },
  holidays: { bg: "#FFF8E1", accent: "#F0A33B" },
  mythology: { bg: "#F3E5F5", accent: "#6A1B9A" },
  fantasy: { bg: "#FCE4EC", accent: "#C2517E" },
  "everyday-objects": { bg: "#FFF3E0", accent: "#E65100" },
  vehicles: { bg: "#E8EAF6", accent: "#303F9F" },
  nature: { bg: "#F1F8E9", accent: "#33691E" },
  geography: { bg: "#E0F7FA", accent: "#00695C" },
  alphabet: { bg: "#FFFDE7", accent: "#F9A825" },
  activities: { bg: "#FBE9E7", accent: "#BF360C" },
  "people-family": { bg: "#FCE4EC", accent: "#AD1457" },
  food: { bg: "#FFF3E0", accent: "#EF6C00" },
  seasons: { bg: "#E8F5E9", accent: "#2E7D32" },
  dinosaurs: { bg: "#EFEBE9", accent: "#4E342E" },
  numbers: { bg: "#E3F2FD", accent: "#1565C0" },
  jobs: { bg: "#ECEFF1", accent: "#37474F" },
  religious: { bg: "#F3E5F5", accent: "#4A148C" },
  music: { bg: "#FCE4EC", accent: "#880E4F" },
  space: { bg: "#E8EAF6", accent: "#1A237E" },
  ocean: { bg: "#E0F2F1", accent: "#00695C" },
  aesthetics: { bg: "#FCE4EC", accent: "#880E4F" },
  educational: { bg: "#FFF8E1", accent: "#FF8F00" },
  science: { bg: "#E8F5E9", accent: "#1B5E20" },
  flowers: { bg: "#FCE4EC", accent: "#C2517E" },
  "adult-relaxation": { bg: "#EDE7F6", accent: "#4527A0" },
  "emotions-sel": { bg: "#FFF3E0", accent: "#E65100" },
  mandalas: { bg: "#F3E5F5", accent: "#6A1B9A" },
  shapes: { bg: "#E3F2FD", accent: "#0277BD" },
  "bugs-insects": { bg: "#F1F8E9", accent: "#827717" },
  history: { bg: "#EFEBE9", accent: "#3E2723" },
  patterns: { bg: "#EDE7F6", accent: "#7B1FA2" },
  personalized: { bg: "#FCE4EC", accent: "#AD1457" },
};
const DEFAULT_STYLE = { bg: "#FFF8E1", accent: "#C2517E" };

const INK = "#2B2118";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapTitle(title: string, maxChars: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function toDataUri(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function buildCoverSvg(book: Book, pages: Buffer[]): Promise<string> {
  const { bg, accent } = CAT_STYLE[book.category] || DEFAULT_STYLE;
  const title = book.name.replace(/\s*[-–—]\s*$/, "");
  const maxChars = title.length > 46 ? 20 : title.length > 30 ? 22 : 26;
  const fontSize = title.length > 46 ? 60 : title.length > 30 ? 68 : 76;
  const lines = wrapTitle(title, maxChars);
  const lineHeight = Math.round(fontSize * 1.12);
  const titleTop = 210;

  const pageW = 380;
  const pageH = Math.round(pageW * 3508 / 2480); // A4 ratio
  const fanY = 620;
  const show = pages.slice(0, 3);
  const fans = show.map((png, i) => {
    const n = show.length;
    const cx = W / 2 + (i - (n - 1) / 2) * 210;
    const rot = n === 1 ? 0 : (i - (n - 1) / 2) * 9;
    const y = fanY + (Math.abs(i - (n - 1) / 2) === 1 && n === 3 ? 28 : 0);
    return `
      <g transform="rotate(${rot} ${cx} ${y + pageH / 2})">
        <rect x="${cx - pageW / 2 - 10}" y="${y - 10}" width="${pageW + 20}" height="${pageH + 20}"
          rx="6" fill="#FFFFFF" filter="url(#shadow)"/>
        <image href="${toDataUri(png)}" x="${cx - pageW / 2}" y="${y}" width="${pageW}" height="${pageH}"/>
      </g>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#2B2118" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="28"
    fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>

  <rect x="${W / 2 - 190}" y="100" width="380" height="48" rx="24" fill="${accent}"/>
  <text x="${W / 2}" y="132" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="22" font-weight="bold" fill="#FFFFFF" letter-spacing="3">COLORING BOOK</text>

  ${lines.map((line, i) => `
  <text x="${W / 2}" y="${titleTop + i * lineHeight}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold"
    fill="${INK}">${esc(line)}</text>`).join("")}

  <text x="${W / 2}" y="${titleTop + lines.length * lineHeight + 8}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${accent}" font-weight="bold">
    ${esc(book.catName)}
  </text>

  ${fans}

  <text x="${W / 2}" y="${H - 130}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="${INK}">
    ${book.pageCount} Printable Pages
  </text>
  <text x="${W / 2}" y="${H - 88}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6B5A4A">
    A4 PDF · Instant Download · Print at Home
  </text>
  <text x="${W / 2}" y="${H - 52}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#6B5A4A" letter-spacing="2">
    GT SHOPPING
  </text>
</svg>`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  const books: Book[] = JSON.parse(await fs.readFile(PLAN, "utf8"));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  let prisma = new PrismaClient({ adapter });

  const isConnErr = (e: unknown): boolean => {
    const m = String((e as Error)?.message || e).toLowerCase();
    return m.includes("connection") || m.includes("econnreset") || m.includes("timeout") ||
      m.includes("terminated") || m.includes("p1017") || m.includes("server has closed");
  };

  async function reconnect() {
    try { await prisma.$disconnect(); } catch { /* ignore */ }
    const a = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    prisma = new PrismaClient({ adapter: a });
    await prisma.$connect();
  }

  let created = 0, skipped = 0, failed = 0;
  const started = Date.now();

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    process.stdout.write(`[${i + 1}/${books.length}] ${book.name} ... `);
    try {
      const product = await prisma.product.findUnique({ where: { slug: book.key } });
      if (!product) {
        console.log("no product");
        failed++;
        continue;
      }
      let imgs: string[] = [];
      try { imgs = JSON.parse(product.images); } catch { /* empty */ }
      if (imgs[0]?.includes("-cover.png")) {
        console.log("skip (has cover)");
        skipped++;
        continue;
      }

      const pages: Buffer[] = [];
      for (const s of book.pageSlugs.slice(0, 3)) {
        try {
          pages.push(await fs.readFile(path.join(PNG_DIR, `${s}.png`)));
        } catch { /* missing cache page */ }
      }
      if (pages.length === 0) {
        console.log("no cached pages");
        failed++;
        continue;
      }

      const svg = await buildCoverSvg(book, pages);
      const resvg = new Resvg(svg, {
        font: {
          fontDirs: ["C:\\Windows\\Fonts"],
          loadSystemFonts: true,
          defaultFontFamily: "Arial",
        },
        fitTo: { mode: "width", value: W },
      });
      const png = Buffer.from(resvg.render().asPng());

      const outPath = path.join(OUT_DIR, `${book.key}-cover.png`);
      await fs.writeFile(outPath, png);

      let cover: { url: string } | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          cover = await putCoverImage({
            productId: product.id,
            fileName: attempt === 1 ? `${book.key}-cover.png` : `${book.key}-cover-r${attempt}.png`,
            data: png,
            mimeType: "image/png",
          });
          break;
        } catch (err) {
          if (attempt < 3) {
            console.log(`\n    [retry cover a${attempt}] ${(err as Error).message.slice(0, 60)}`);
            await sleep(1000 * attempt);
          } else throw err;
        }
      }
      if (!cover) throw new Error("cover upload returned null");

      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify([cover.url, ...imgs]) },
      });
      created++;
      console.log(`ok (${(png.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      const msg = (err as Error).message || String(err);
      if (isConnErr(err)) {
        console.log("\n    [conn retry] reconnecting...");
        await sleep(2000);
        try { await reconnect(); } catch { /* ignore */ }
      }
      failed++;
      console.error(`ERR: ${msg.slice(0, 120)}`);
    }
    if ((i + 1) % 20 === 0) {
      const mins = ((Date.now() - started) / 60000).toFixed(1);
      console.log(`  ... progress ${i + 1}/${books.length} (${mins}m) ok=${created} skip=${skipped} fail=${failed}`);
    }
  }

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nDone in ${mins}m. created=${created} skipped=${skipped} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
