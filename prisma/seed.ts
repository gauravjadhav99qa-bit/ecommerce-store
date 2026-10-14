import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildDemoPdf } from "../src/lib/demo-pdf";
import { buildDemoCoverSvg } from "../src/lib/demo-cover";
import { putProductFile } from "../src/lib/storage";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAt?: number;
  featured?: boolean;
  description: string;
  pageCount: number;
  paperSize: string;
  emoji: string;
  tags: string[];
};

const CATEGORIES: { name: string; slug: string }[] = [
  { name: "Animal Colouring Books", slug: "animal-colouring" },
  { name: "Mandala Colouring Pages", slug: "mandala-colouring" },
  { name: "Kids' Colouring Books", slug: "kids-colouring" },
  { name: "Dinosaur & Fantasy Pages", slug: "dinosaur-fantasy" },
  { name: "Alphabet & Number Worksheets", slug: "alphabet-numbers" },
  { name: "Preschool Activity Books", slug: "preschool-activity" },
  { name: "Puzzle & Maze Books", slug: "puzzles-mazes" },
  { name: "Educational E-books", slug: "educational-ebooks" },
  { name: "Planners & Journals", slug: "planners-journals" },
  { name: "Bundles & Collections", slug: "bundles" },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: "Kawaii Animals Colouring Book",
    slug: "kawaii-animals-colouring-book",
    category: "animal-colouring",
    price: 14900,
    compareAt: 24900,
    featured: true,
    description:
      "Adorable kawaii-style animals ready to be brought to life with colour. 30 printable pages of cats, bunnies, bears and more — perfect for kids and kids at heart.",
    pageCount: 32,
    paperSize: "A4 & US Letter",
    emoji: "🐾",
    tags: ["animals", "kawaii", "kids", "printable"],
  },
  {
    name: "Farm Animals Colouring Pages",
    slug: "farm-animals-colouring-pages",
    category: "animal-colouring",
    price: 9900,
    description:
      "Meet the friendly farm! 20 printable pages featuring cows, sheep, ducks and tractors for little farmers.",
    pageCount: 22,
    paperSize: "A4 & US Letter",
    emoji: "🐮",
    tags: ["animals", "farm", "toddler"],
  },
{
    name: "Ocean Friends Colouring Book",
    slug: "ocean-friends-colouring-book",
    category: "animal-colouring",
    price: 12900,
    compareAt: 19900,
    featured: true,
    description:
      "Dive underwater with 25 pages of turtles, dolphins, octopuses and coral reefs. A calming ocean adventure in every sheet.",
    pageCount: 27,
    paperSize: "A4 & US Letter",
    emoji: "🐢",
    tags: ["animals", "ocean", "kids"],
  },
  {
    name: "Mandala Mindfulness Colouring Book",
    slug: "mandala-mindfulness-colouring-book",
    category: "mandala-colouring",
    price: 19900,
    compareAt: 29900,
    featured: true,
    description:
      "Unwind with 40 intricate mandala designs for adults. Printed on A4, these pages are made for slow evenings and your favourite pencil set.",
    pageCount: 42,
    paperSize: "A4",
    emoji: "🌸",
    tags: ["mandala", "adult", "mindfulness", "stress relief"],
  },
  {
    name: "Easy Mandalas for Beginners",
    slug: "easy-mandalas-for-beginners",
    category: "mandala-colouring",
    price: 9900,
    description:
      "Simple, open-pattern mandalas designed for beginners, seniors and anyone who loves big, easy shapes to colour.",
    pageCount: 25,
    paperSize: "A4 & US Letter",
    emoji: "✨",
    tags: ["mandala", "easy", "adult", "beginners"],
  },
  {
    name: "Boho Mandalas Printable Set",
    slug: "boho-mandalas-printable-set",
    category: "mandala-colouring",
    price: 14900,
    description:
      "Earthy boho-style mandalas with floral and geometric motifs. 30 pages that look lovely framed once coloured.",
    pageCount: 32,
    paperSize: "A4",
    emoji: "🌿",
    tags: ["mandala", "boho", "decor"],
  },
  {
    name: "Little Artists Colouring Book",
    slug: "little-artists-colouring-book",
    category: "kids-colouring",
    price: 12900,
    featured: true,
    description:
      "Big shapes, thick outlines and joyful scenes made for tiny hands. 30 pages of playgrounds, pets and birthday cakes.",
    pageCount: 32,
    paperSize: "A4 & US Letter",
    emoji: " crayon".trim(),
    tags: ["kids", "toddler", "easy"],
  },
  {
    name: "Space Adventure Colouring Book",
    slug: "space-adventure-colouring-book",
    category: "kids-colouring",
    price: 14900,
    compareAt: 21900,
    description:
      "Blast off with rockets, planets and friendly aliens. 28 printable pages for young astronomers.",
    pageCount: 30,
    paperSize: "A4 & US Letter",
    emoji: "🚀",
    tags: ["kids", "space", "boys girls"],
  },
  {
    name: "My First Colouring Book",
    slug: "my-first-colouring-book",
    category: "kids-colouring",
    price: 7900,
    description:
      "Extra-thick outlines and simple shapes for ages 2–4. 20 gentle pages of balls, balloons and smiling suns.",
    pageCount: 22,
    paperSize: "A4",
    emoji: "🎈",
    tags: ["toddler", "first colouring", "preschool"],
  },
  {
    name: "Dinosaur World Colouring Book",
    slug: "dinosaur-world-colouring-book",
    category: "dinosaur-fantasy",
    price: 14900,
    featured: true,
    description:
      "T-rex, triceratops and erupting volcanoes! 30 roarsome pages for dinosaur lovers aged 4–10.",
    pageCount: 32,
    paperSize: "A4 & US Letter",
    emoji: "🦕",
    tags: ["dinosaurs", "kids", "boys girls"],
  },
  {
    name: "Dragon & Castle Fantasy Pages",
    slug: "dragon-castle-fantasy-pages",
    category: "dinosaur-fantasy",
    price: 12900,
    description:
      "Fire-breathing dragons, mighty castles and brave knights. 25 fantasy pages waiting for a splash of colour.",
    pageCount: 27,
    paperSize: "A4 & US Letter",
    emoji: "🐉",
    tags: ["fantasy", "dragons", "kids"],
  },
  {
    name: "Unicorns & Rainbows Colouring Book",
    slug: "unicorns-rainbows-colouring-book",
    category: "dinosaur-fantasy",
    price: 12900,
    compareAt: 17900,
    description:
      "Magical unicorns, glittery rainbows and cloud castles across 26 dreamy printable pages.",
    pageCount: 28,
    paperSize: "A4 & US Letter",
    emoji: "🦄",
    tags: ["unicorns", "fantasy", "kids"],
  },
  {
    name: "Alphabet Tracing with Oliver the Owl",
    slug: "alphabet-tracing-oliver-owl",
    category: "alphabet-numbers",
    price: 14900,
    featured: true,
    description:
      "Learn A to Z with Oliver the Owl! Trace uppercase and lowercase letters with guided strokes. A4 printable PDF.",
    pageCount: 30,
    paperSize: "A4",
    emoji: "🦉",
    tags: ["alphabet", "tracing", "handwriting", "preschool"],
  },
  {
    name: "Number Practice 1–20 Workbooks",
    slug: "number-practice-1-20-workbook",
    category: "alphabet-numbers",
    price: 12900,
    description:
      "Count, trace and write numbers 1 to 20. Includes counting objects and number puzzles across 24 pages.",
    pageCount: 26,
    paperSize: "A4 & US Letter",
    emoji: "🔢",
    tags: ["numbers", "math", "preschool", "worksheets"],
  },
  {
    name: "Shapes & Colours worksheets",
    slug: "shapes-and-colours-worksheets",
    category: "alphabet-numbers",
    price: 9900,
    description:
      "Circle, square, triangle — and every colour of the rainbow. 20 printable worksheets for early learners.",
    pageCount: 22,
    paperSize: "A4",
    emoji: "🔺",
    tags: ["shapes", "colours", "worksheets", "preschool"],
  },
  {
    name: "Preschool Activity Workbook (ABCs, Numbers, Shapes)",
    slug: "preschool-activity-workbook",
    category: "preschool-activity",
    price: 24900,
    compareAt: 39900,
    featured: true,
    description:
      "The everything workbook: 120+ pages of alphabet, numbers, shapes, matching and early writing practice for ages 3–5.",
    pageCount: 124,
    paperSize: "A4 & US Letter",
    emoji: "📚",
    tags: ["preschool", "workbook", "homeschool", "activity"],
  },
  {
    name: "Cut, Paste & Play Activity Book",
    slug: "cut-paste-play-activity-book",
    category: "preschool-activity",
    price: 14900,
    description:
      "Scissor-skills fun! 30 pages of cut-and-paste scenes, matching games and sticker-style activities.",
    pageCount: 32,
    paperSize: "A4",
    emoji: "✂️",
    tags: ["preschool", "fine motor", "activity"],
  },
  {
    name: "Maze Adventure Book for Kids",
    slug: "maze-adventure-book-for-kids",
    category: "puzzles-mazes",
    price: 12900,
    description:
      "Help the robots find their way home! 40 mazes graded from easy to tricky — screen-free entertainment.",
    pageCount: 42,
    paperSize: "A4 & US Letter",
    emoji: "🧩",
    tags: ["mazes", "puzzles", "kids"],
  },
  {
    name: "Spot the Difference & Puzzle Pack",
    slug: "spot-the-difference-puzzle-pack",
    category: "puzzles-mazes",
    price: 14900,
    compareAt: 19900,
    description:
      "15 pairs of spot-the-difference scenes plus word searches and picture puzzles. Answers included at the back.",
    pageCount: 36,
    paperSize: "A4",
    emoji: "🔍",
    tags: ["puzzles", "spot the difference", "kids"],
  },
  {
    name: "Habit Tracker & Wellness Journal (Printable)",
    slug: "habit-tracker-wellness-journal",
    category: "planners-journals",
    price: 19900,
    featured: true,
    description:
      "A 60-page printable wellness journal: habit trackers, mood pages, gratitude prompts and monthly reviews.",
    pageCount: 62,
    paperSize: "A4 & US Letter",
    emoji: "🧘",
    tags: ["journal", "habits", "wellness", "printable"],
  },
  {
    name: "Weekly Planner Printable (52 Weeks)",
    slug: "weekly-planner-printable-52-weeks",
    category: "planners-journals",
    price: 14900,
    description:
      "A clean, undated weekly planner — one page per week with priorities, schedules and notes. Print as many copies as you need.",
    pageCount: 56,
    paperSize: "A4 & US Letter",
    emoji: "🗓️",
    tags: ["planner", "weekly", "productivity"],
  },
  {
    name: "Kids' Mindfulness E-book for Parents",
    slug: "kids-mindfulness-ebook-parents",
    category: "educational-ebooks",
    price: 24900,
    description:
      "A practical 45-page e-book: simple mindfulness exercises, breathing games and calm-down scripts you can use at home tonight.",
    pageCount: 48,
    paperSize: "US Letter",
    emoji: "💛",
    tags: ["ebook", "mindfulness", "parents"],
  },
];

const BUNDLES: {
  name: string;
  slug: string;
  price: number;
  compareAt: number;
  description: string;
  emoji: string;
  items: string[];
}[] = [
  {
    name: "Mega Animal Colouring Bundle",
    slug: "mega-animal-colouring-bundle",
    price: 29900,
    compareAt: 37700,
    description:
      "All three animal colouring books in one download: Kawaii Animals, Farm Friends and Ocean Friends. 79 printable pages at a bundle price.",
    emoji: "🎁",
    items: [
      "kawaii-animals-colouring-book",
      "farm-animals-colouring-pages",
      "ocean-friends-colouring-book",
    ],
  },
  {
    name: "Preschool Mega Bundle",
    slug: "preschool-mega-bundle",
    price: 39900,
    compareAt: 57700,
    description:
      "Everything a preschooler needs: the 120+ page activity workbook, alphabet tracing, number practice and shapes worksheets. 192 pages total.",
    emoji: "🎈",
    items: [
      "preschool-activity-workbook",
      "alphabet-tracing-oliver-owl",
      "number-practice-1-20-workbook",
      "shapes-and-colours-worksheets",
    ],
  },
  {
    name: "Kids Creative Mega Bundle",
    slug: "kids-creative-mega-bundle",
    price: 34900,
    compareAt: 52700,
    description:
      "Colouring, mazes, puzzles and space adventures — 132 pages of screen-free fun in one instant download.",
    emoji: "🌟",
    items: [
      "space-adventure-colouring-book",
      "dinosaur-world-colouring-book",
      "maze-adventure-book-for-kids",
      "spot-the-difference-puzzle-pack",
    ],
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  "animal-colouring": "🐾",
  "mandala-colouring": "🌸",
  "kids-colouring": "🎨",
  "dinosaur-fantasy": "🦄",
  "alphabet-numbers": "🔤",
  "preschool-activity": "🧸",
  "puzzles-mazes": "🧩",
  "educational-ebooks": "📖",
  "planners-journals": "🗓️",
  bundles: "🎁",
};

async function writeCover(slug: string, svg: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "products");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.svg`);
  await writeFile(filePath, svg, "utf8");
  return `/products/${slug}.svg`;
}

async function createDemoProduct(p: SeedProduct, index: number) {
  const image = await writeCover(
    p.slug,
    buildDemoCoverSvg({
      title: p.name,
      category: CATEGORIES.find((c) => c.slug === p.category)?.name || "",
      emoji: p.emoji,
      seedIndex: index,
    })
  );

  const category = await prisma.category.findUnique({
    where: { slug: p.category },
  });

  const product = await prisma.product.create({
    data: {
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compareAt: p.compareAt ?? null,
      images: JSON.stringify([image]),
      sku: `IB-${p.slug.slice(0, 18).toUpperCase()}`,
      stock: 9999,
      isActive: true,
      featured: p.featured ?? false,
      isDigital: true,
      productType: "SINGLE",
      tags: JSON.stringify(p.tags),
      pageCount: p.pageCount,
      paperSize: p.paperSize,
      fileFormat: "PDF",
      printInstructions:
        "Print at home on A4 or US Letter paper. Use 'Actual size' (100% scale) for best results. For colouring pages, plain paper works well; for a premium feel try 120–160 GSM.",
      license:
        "Personal use only. Print unlimited copies for your own family/classroom. Do not resell, share or redistribute the digital files.",
      category: category ? { connect: { id: category.id } } : undefined,
    },
  });

  const pdf = buildDemoPdf({
    title: p.name,
    subtitle: `${p.pageCount} pages • ${p.paperSize}`,
    pageCount: Math.min(5, Math.max(3, Math.floor(p.pageCount / 10))),
    seedIndex: index,
  });
  const file = await putProductFile({
    productId: product.id,
    fileName: `${p.slug}.pdf`,
    data: pdf,
    mimeType: "application/pdf",
  });
  await prisma.productFile.create({
    data: {
      productId: product.id,
      fileName: `${p.name}.pdf`,
      storagePath: file.storagePath,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sortOrder: 0,
    },
  });

  console.log(`✓ ${p.name}`);
  return product;
}

async function main() {
  console.log("Seeding GT Shopping demo catalogue...");

  // Idempotent cleanup of previous demo runs (never touches users/orders).
  const demoSlugs = [
    ...PRODUCTS.map((p) => p.slug),
    ...BUNDLES.map((b) => b.slug),
  ];
  const existing = await prisma.product.findMany({
    where: { slug: { in: demoSlugs } },
    select: { id: true },
  });
  const existingIds = existing.map((p) => p.id);
  if (existingIds.length) {
    await prisma.bundleItem.deleteMany({
      where: { OR: [{ bundleId: { in: existingIds } }, { productId: { in: existingIds } }] },
    });
    await prisma.productFile.deleteMany({ where: { productId: { in: existingIds } } });
    await prisma.product.deleteMany({ where: { id: { in: existingIds } } });
  }

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  const bySlug = new Map<string, string>();
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = await createDemoProduct(PRODUCTS[i], i);
    bySlug.set(p.slug, p.id);
  }

  for (let i = 0; i < BUNDLES.length; i++) {
    const b = BUNDLES[i];
    const bundleCategory = await prisma.category.findUnique({
      where: { slug: "bundles" },
    });
    const image = await writeCover(
      b.slug,
      buildDemoCoverSvg({
        title: b.name,
        category: "Bundles & Collections",
        emoji: b.emoji,
        seedIndex: PRODUCTS.length + i,
      })
    );
    const bundle = await prisma.product.create({
      data: {
        name: b.name,
        slug: b.slug,
        description: b.description,
        price: b.price,
        compareAt: b.compareAt,
        images: JSON.stringify([image]),
        sku: `IB-BUNDLE-${i + 1}`,
        stock: 9999,
        isActive: true,
        featured: i === 0,
        isDigital: true,
        productType: "BUNDLE",
        tags: JSON.stringify(["bundle", "collection", "deal"]),
        fileFormat: "PDF",
        paperSize: "A4 & US Letter",
        printInstructions:
          "Each book in this bundle is a separate PDF. Print at home on A4 or US Letter at 100% scale.",
        license:
          "Personal use only. Print unlimited copies for your own family/classroom. Do not resell, share or redistribute the digital files.",
        category: bundleCategory
          ? { connect: { id: bundleCategory.id } }
          : undefined,
      },
    });
    for (let j = 0; j < b.items.length; j++) {
      const componentId = bySlug.get(b.items[j]);
      if (!componentId) continue;
      await prisma.bundleItem.create({
        data: { bundleId: bundle.id, productId: componentId, sortOrder: j },
      });
    }
    console.log(`✓ bundle: ${b.name}`);
  }

  // Hide any legacy (physical GT SHOP) products from the storefront.
  const hidden = await prisma.product.updateMany({
    where: { slug: { notIn: demoSlugs }, isActive: true },
    data: { isActive: false },
  });
  if (hidden.count) {
    console.log(`✓ hid ${hidden.count} legacy product(s)`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
