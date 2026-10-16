import { promises as fs } from "fs";
import path from "path";

const MANIFEST = path.join("scripts", "out_pcp", "manifest.json");
const PLAN_OUT = path.join("scripts", "out_pcp", "book-plan.json");

type PcpResult = {
  slug: string; title: string; subject: string; category: string;
  topic?: string; age_band?: string; difficulty?: number; orientation?: string;
  files: { pdf_a4?: string; png_a4_300?: string };
};

type Book = {
  key: string;          // product slug base
  name: string;         // display name
  category: string;     // category slug
  catName: string;      // category display name
  kind: "themed" | "variety";
  pageSlugs: string[];
  pageCount: number;
};

const CAT_NAMES: Record<string, string> = {
  animals: "Animals", holidays: "Holidays & Celebrations", dinosaurs: "Dinosaurs",
  fantasy: "Fantasy & Mythical", ocean: "Ocean & Sea Life", "bugs-insects": "Bugs & Insects",
  seasons: "Seasons & Months", nature: "Nature & Landscapes", flowers: "Flowers",
  vehicles: "Vehicles & Transportation", food: "Food & Drink", space: "Space & Astronomy",
  alphabet: "Alphabet & Letters", numbers: "Numbers & Math", shapes: "Shapes & Colors",
  educational: "Learning & Classroom", activities: "Activity Sheets & Formats",
  science: "Science & STEM", geography: "Geography & Civics", history: "History & Mythology",
  mandalas: "Mandalas", "adult-relaxation": "Adult & Relaxation",
  patterns: "Patterns & Geometric", jobs: "Jobs & Community Helpers",
  sports: "Sports & Movement", music: "Music & Arts", "emotions-sel": "Emotions & SEL",
  "people-family": "People & Family", "everyday-objects": "Everyday Objects & Places",
  religious: "Faith & Religion", aesthetics: "Styles & Aesthetics",
  personalized: "Names & Personalized", "famous-people": "Famous People",
  mythology: "World Mythology", "world-cultures": "World Cultures",
};

// Tuning
const MIN_CLUSTER = 8;    // topic with >= this many pages becomes its own themed book
const MAX_BOOK = 15;      // target pages per book
const VAR_SIZE = 12;      // pages per variety volume

function titleCase(slug: string): string {
  return slug.split(/[-\s]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function plural(word: string): string {
  if (/s$/i.test(word)) return word;
  if (/y$/i.test(word)) return word.slice(0, -1) + "ies";
  return word + "s";
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Keep only pages that have the files we need.
function usable(pages: PcpResult[]): PcpResult[] {
  return pages.filter((p) => p.orientation !== "landscape" && p.files?.pdf_a4 && p.files?.png_a4_300);
}

function buildBooksForCategory(catSlug: string, rawPages: PcpResult[]): Book[] {
  const catName = CAT_NAMES[catSlug] || titleCase(catSlug);
  const books: Book[] = [];

  // Dedupe by slug: paginated search can return the same page on two
  // consecutive result pages when popularity order shifts between requests.
  const seen = new Set<string>();
  const pages: PcpResult[] = [];
  for (const p of rawPages) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    pages.push(p);
  }

  // 1. Cluster by topic.
  const byTopic = new Map<string, PcpResult[]>();
  for (const p of pages) {
    const t = (p.topic || "").trim().toLowerCase();
    if (!t) continue;
    if (!byTopic.has(t)) byTopic.set(t, []);
    byTopic.get(t)!.push(p);
  }

  // 2. Themed books from big clusters (>= MIN_CLUSTER pages). Split huge clusters into volumes.
  const used = new Set<string>();
  const bigClusters = [...byTopic.entries()]
    .filter(([, arr]) => arr.length >= MIN_CLUSTER)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [topic, arr] of bigClusters) {
    for (const p of arr) used.add(p.slug);
    const base = plural(titleCase(topic));
    const volumes = Math.ceil(arr.length / MAX_BOOK);
    for (let v = 0; v < volumes; v++) {
      const slice = arr.slice(v * MAX_BOOK, (v + 1) * MAX_BOOK);
      if (slice.length === 0) continue;
      const volSuffix = volumes > 1 ? ` Vol. ${v + 1}` : "";
      books.push({
        key: slugify(`${catSlug}-${topic}-book${volumes > 1 ? `-v${v + 1}` : ""}`),
        name: `${base} Coloring Book${volSuffix}`,
        category: catSlug, catName, kind: "themed",
        pageSlugs: slice.map((p) => p.slug), pageCount: slice.length,
      });
    }
  }

  // 3. Long tail -> variety volumes, sorted by difficulty then age so similar pages group.
  const rest = pages.filter((p) => !used.has(p.slug));
  rest.sort((a, b) => {
    const da = a.difficulty ?? 3, db = b.difficulty ?? 3;
    if (da !== db) return da - db;
    return (a.age_band || "").localeCompare(b.age_band || "");
  });
  const varCount = Math.ceil(rest.length / VAR_SIZE);
  for (let i = 0; i < varCount; i++) {
    const slice = rest.slice(i * VAR_SIZE, (i + 1) * VAR_SIZE);
    if (slice.length === 0) continue;
    books.push({
      key: slugify(`${catSlug}-book-${i + 1}`),
      name: `${catName} Coloring Book${varCount > 1 ? ` Vol. ${i + 1}` : ""}`,
      category: catSlug, catName, kind: "variety",
      pageSlugs: slice.map((p) => p.slug), pageCount: slice.length,
    });
  }

  return books;
}

// Categories excluded from the storefront plan.
const EXCLUDE = new Set(["famous-people"]);

async function main() {
  const manifest: Record<string, PcpResult[]> = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const allBooks: Book[] = [];
  const byCategory: Record<string, number> = {};

  // Process biggest categories first so the plan output is easy to scan.
  const cats = Object.entries(manifest)
    .filter(([slug]) => !EXCLUDE.has(slug))
    .sort((a, b) => b[1].length - a[1].length);
  for (const [catSlug, raw] of cats) {
    const pages = usable(raw);
    const books = buildBooksForCategory(catSlug, pages);
    allBooks.push(...books);
    byCategory[catSlug] = books.length;
  }

  await fs.mkdir(path.dirname(PLAN_OUT), { recursive: true });
  await fs.writeFile(PLAN_OUT, JSON.stringify(allBooks, null, 2));

  // Report
  const totalBooks = allBooks.length;
  const totalPages = allBooks.reduce((n, b) => n + b.pageCount, 0);
  const themed = allBooks.filter((b) => b.kind === "themed").length;
  const variety = totalBooks - themed;
  const avg = (totalPages / totalBooks).toFixed(1);

  console.log("=== BOOK PLAN ===");
  console.log(`categories: ${Object.keys(byCategory).length}`);
  console.log(`books: ${totalBooks}  (themed ${themed} + variety ${variety})`);
  console.log(`pages placed: ${totalPages} / ${usable(Object.values(manifest).flat()).length} usable`);
  console.log(`avg pages/book: ${avg}`);
  console.log("\nbooks per category:");
  for (const [c, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(18)} ${String(n).padStart(3)} books`);
  }
  console.log(`\nPlan saved to ${PLAN_OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
