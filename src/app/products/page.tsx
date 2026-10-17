import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop printable colouring books, worksheets & planners",
  description:
    "Browse instant-download PDFs: colouring books for kids and adults, preschool worksheets, activity books, planners and bundles.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const featured = params.featured === "1" || params.featured === "true";
  const search = typeof params.search === "string" ? params.search.trim() : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const page = Math.max(1, Number(params.page) || 1);
  const age = typeof params.age === "string" ? params.age : undefined;
  const maxPrice =
    typeof params.maxPrice === "string" && !Number.isNaN(Number(params.maxPrice))
      ? Number(params.maxPrice) * 100
      : undefined;

  const AGE_TAG_MAP: Record<string, string[]> = {
    "3-5": ["age:2-4", "age:5-8"],
    "5-8": ["age:5-8", "age:9-12"],
    "8+": ["age:9-12", "age:13+"],
    adult: ["age:13+", "age:9-12"],
  };

  const ageTags = age ? AGE_TAG_MAP[age] : undefined;

  const where = {
    isActive: true,
    isDigital: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(featured ? { featured: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { tags: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    ...(ageTags
      ? { OR: ageTags.map((t) => ({ tags: { contains: t, mode: "insensitive" as const } })) }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { products: { some: { isActive: true, isDigital: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const heading = activeCategory
    ? activeCategory.name
    : featured
      ? "Bestsellers"
      : search
        ? `Results for “${search}”`
        : "All printables";

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string") sp.set(k, v);
    }
    sp.set("page", String(p));
    return `/products?${sp.toString()}`;
  }

  function ageHref(a: string | null) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string" && k !== "age" && k !== "page") sp.set(k, v);
    }
    if (a) sp.set("age", a);
    const qs = sp.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  const AGE_OPTIONS = [
    { key: "3-5", label: "Ages 3–5" },
    { key: "5-8", label: "Ages 5–8" },
    { key: "8+", label: "Ages 8+" },
    { key: "adult", label: "Adults" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <nav className="text-xs sm:text-sm text-ink-soft mb-4 sm:mb-6">
        <Link href="/" className="hover:text-berry">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{heading}</span>
      </nav>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">{heading}</h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            {total} printable{total === 1 ? "" : "s"} · instant PDF download
          </p>
        </div>
        <form className="hidden sm:flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-ink-soft">
            Sort
          </label>
          <Suspense fallback={null}>
            <SortSelect value={sort} />
          </Suspense>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:hidden">
          <Link
            href="/products"
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !category && !featured
                ? "bg-ink text-cream"
                : "bg-white text-ink-soft border border-cream-dark"
            }`}
          >
            All
          </Link>
          {AGE_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={ageHref(opt.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                age === opt.key
                  ? "bg-berry text-white"
                  : "bg-white text-ink-soft border border-cream-dark"
              }`}
            >
              {opt.label}
            </Link>
          ))}
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                category === cat.slug
                  ? "bg-ink text-cream"
                  : "bg-white text-ink-soft border border-cream-dark"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-28 space-y-7">
            <div>
              <h3 className="font-bold text-sm mb-3 font-display">Age</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={ageHref(null)}
                    className={`text-sm ${!age ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                  >
                    All ages
                  </Link>
                </li>
                {AGE_OPTIONS.map((opt) => (
                  <li key={opt.key}>
                    <Link
                      href={ageHref(opt.key)}
                      className={`text-sm ${age === opt.key ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                    >
                      {opt.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 font-display">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/products"
                    className={`text-sm ${!category ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                  >
                    All categories
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`text-sm ${category === cat.slug ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 font-display">Price</h3>
              <ul className="space-y-2">
                {[
                  { label: "Under ₹150", value: "150" },
                  { label: "Under ₹250", value: "250" },
                  { label: "All prices", value: "" },
                ].map((opt) => (
                  <li key={opt.label}>
                    <Link
                      href={
                        opt.value
                          ? `/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([k]) => typeof params[k] === "string") as [string, string][]), maxPrice: opt.value }).toString()}`
                          : `/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([k]) => typeof params[k] === "string" && k !== "maxPrice") as [string, string][]), }).toString()}`
                      }
                      className={`text-sm ${maxPrice === Number(opt.value) * 100 && opt.value ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                    >
                      {opt.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 font-display">Sort by</h3>
              <ul className="space-y-2">
                {[
                  { value: "newest", label: "Newest" },
                  { value: "price_asc", label: "Price: low to high" },
                  { value: "price_desc", label: "Price: high to low" },
                ].map((s) => (
                  <li key={s.value}>
                    <Link
                      href={`/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([k]) => typeof params[k] === "string") as [string, string][]), sort: s.value }).toString()}`}
                      className={`text-sm ${sort === s.value ? "font-semibold text-berry" : "text-ink-soft hover:text-ink"}`}
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-2 mt-10"
                  aria-label="Pagination"
                >
                  {page > 1 && (
                    <Link
                      href={pageHref(page - 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-cream-dark bg-white hover:border-berry"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="text-sm text-ink-soft px-2">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={pageHref(page + 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-cream-dark bg-white hover:border-berry"
                    >
                      Next →
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-ink-soft mb-4 text-sm">
                No printables found — try a different search or category.
              </p>
              <Link
                href="/products"
                className="text-berry font-semibold text-sm hover:underline"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
