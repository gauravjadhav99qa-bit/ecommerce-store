import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { promises as fs } from "fs";
import path from "path";

const API_BASE = "https://printablecoloringpages.ai/api";
const KEY = process.env.PRINTABLE_COLORING_PAGES_AI_API_KEY;
const OUT = path.join("scripts", "out_pcp", "manifest.json");
const PER_PAGE = 30;
const DELAY_MS = 250; // be polite to their API

type PcpResult = {
  slug: string;
  title: string;
  subject: string;
  category: string;
  topic?: string;
  age_band?: string;
  difficulty?: number;
  orientation?: string;
  license?: string;
  files: { pdf_a4?: string; png_a4_300?: string; svg?: string };
};

// Every category discovered on /coloring-pages/ (slug -> display name).
const CATEGORIES: Record<string, string> = {
  animals: "Animals",
  holidays: "Holidays & Celebrations",
  dinosaurs: "Dinosaurs",
  fantasy: "Fantasy & Mythical",
  ocean: "Ocean & Sea Life",
  "bugs-insects": "Bugs & Insects",
  seasons: "Seasons & Months",
  nature: "Nature & Landscapes",
  flowers: "Flowers",
  vehicles: "Vehicles & Transportation",
  food: "Food & Drink",
  space: "Space & Astronomy",
  alphabet: "Alphabet & Letters",
  numbers: "Numbers & Math",
  shapes: "Shapes & Colors",
  educational: "Learning & Classroom",
  activities: "Activity Sheets & Formats",
  science: "Science & STEM",
  geography: "Geography & Civics",
  history: "History & Mythology",
  mandalas: "Mandalas",
  "adult-relaxation": "Adult & Relaxation",
  patterns: "Patterns & Geometric",
  jobs: "Jobs & Community Helpers",
  sports: "Sports & Movement",
  music: "Music & Arts",
  "emotions-sel": "Emotions & SEL",
  "people-family": "People & Family",
  "everyday-objects": "Everyday Objects & Places",
  religious: "Faith & Religion",
  aesthetics: "Styles & Aesthetics",
  personalized: "Names & Personalized",
  "famous-people": "Famous People",
  mythology: "World Mythology",
  "world-cultures": "World Cultures",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function searchPage(category: string, page: number): Promise<{ total: number; results: PcpResult[] }> {
  if (!KEY) throw new Error("PRINTABLE_COLORING_PAGES_AI_API_KEY missing — check .env");
  const url = `${API_BASE}/pages/search?category=${encodeURIComponent(category)}&page=${page}&per_page=${PER_PAGE}&key=${KEY}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`search ${category} p${page} -> HTTP ${res.status}`);
  return (await res.json()) as { total: number; results: PcpResult[] };
}

async function main() {
  // Resume if a manifest already exists.
  let manifest: Record<string, PcpResult[]> = {};
  try {
    manifest = JSON.parse(await fs.readFile(OUT, "utf8"));
    console.log(`Resuming from existing manifest (${Object.keys(manifest).length} categories).`);
  } catch {
    /* fresh */
  }

  let apiCalls = 0;
  for (const [slug, name] of Object.entries(CATEGORIES)) {
    if (manifest[slug]) {
      console.log(`  [skip] ${slug} (${manifest[slug].length} already crawled)`);
      continue;
    }
    const collected: PcpResult[] = [];
    let page = 1;
    let total = Infinity;
    try {
      while (collected.length < total) {
        const { total: t, results } = await searchPage(slug, page);
        apiCalls++;
        total = t;
        if (results.length === 0) break;
        collected.push(...results);
        page++;
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`  [ERR]  ${slug}: ${(err as Error).message}`);
      continue; // leave uncrawled so a re-run retries it
    }
    manifest[slug] = collected;
    console.log(`  [ok]   ${slug} -> ${collected.length}/${total} pages (${name})`);

    // Persist incrementally so a crash mid-run doesn't lose work.
    await fs.mkdir(path.dirname(OUT), { recursive: true });
    await fs.writeFile(OUT, JSON.stringify(manifest));
  }

  // Summary
  const cats = Object.keys(manifest).length;
  const pages = Object.values(manifest).reduce((n, a) => n + a.length, 0);
  const usable = Object.values(manifest)
    .flat()
    .filter((p) => p.orientation !== "landscape" && p.files?.pdf_a4 && p.files?.png_a4_300).length;
  console.log(`\nManifest complete: ${cats} categories, ${pages} pages, ${usable} usable (portrait + has pdf+png).`);
  console.log(`API calls this run: ${apiCalls}. Saved to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
