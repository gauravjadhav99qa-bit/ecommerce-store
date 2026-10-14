import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton from "./AddToCartButton";
import ReviewSection from "@/components/ReviewSection";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import ProductSamplePreviews from "@/components/ProductSamplePreviews";
import StickyBuyBar from "@/components/StickyBuyBar";
import Link from "next/link";
import { parseImages } from "@/lib/utils";
import {
  Download,
  FileText,
  Printer,
  Scale,
  Tag,
  ArrowRight,
  ListChecks,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gtshoppingonline.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });
  if (!product || !product.isActive) return { title: "Not found" };
  const images = parseImages(product.images);
  const specs = [
    product.pageCount ? `${product.pageCount} pages` : null,
    product.paperSize,
    product.fileFormat || "PDF",
    "Instant download",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: product.name,
    description: product.description?.slice(0, 160) || `${product.name} — printable PDF, instant download.`,
    alternates: { canonical: `${siteUrl}/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description || "",
      images: images[0] ? [images[0]] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { name: true, firstName: true } } },
        orderBy: { createdAt: "desc" },
      },
      bundleItems: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product || !product.isActive || !product.isDigital) notFound();

  const images = parseImages(product.images);
  const bundleProducts = product.bundleItems.map((bi) => bi.product);
  const bundleValue = bundleProducts.reduce((sum, p) => sum + p.price, 0);

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      isDigital: true,
      id: { not: product.id },
      ...(product.categoryId
        ? { categoryId: product.categoryId }
        : { tags: { contains: (JSON.parse(product.tags || "[]")[0] as string) || "" } }),
    },
    take: 4,
    orderBy: { featured: "desc" },
  });

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  // Derive a simple "what's inside" breakdown from tags + category + page count.
  const tagList = JSON.parse(product.tags || "[]") as string[];
  const insideBullets: string[] = [];
  if (product.pageCount) {
    insideBullets.push(`${product.pageCount} printable pages`);
  }
  if (tagList.includes("mandala")) insideBullets.push("Mandala / mindfulness designs");
  if (tagList.includes("animals") || tagList.includes("kawaii"))
    insideBullets.push("Cute animal characters");
  if (tagList.includes("alphabet")) insideBullets.push("Alphabet tracing practice");
  if (tagList.includes("numbers")) insideBullets.push("Number recognition & counting");
  if (tagList.includes("preschool") || tagList.includes("toddler"))
    insideBullets.push("Preschool-friendly large shapes");
  if (tagList.includes("mazes")) insideBullets.push("Fun mazes of increasing difficulty");
  if (tagList.includes("puzzles")) insideBullets.push("Puzzles & spot-the-difference");
  if (tagList.includes("dinosaurs")) insideBullets.push("Dinosaur scenes");
  if (tagList.includes("unicorns") || tagList.includes("fantasy"))
    insideBullets.push("Fantasy & unicorn scenes");
  if (tagList.includes("planner")) insideBullets.push("Weekly planning layouts");
  if (tagList.includes("journal")) insideBullets.push("Guided journal prompts");
  if (insideBullets.length === 0) {
    insideBullets.push("Print-ready original artwork");
    insideBullets.push("Thick outlines easy for small hands");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.description || `${product.name} — printable PDF, instant download.`,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: "GT Shopping" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    aggregateRating:
      product.reviews.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: product.reviews.length,
          }
        : undefined,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/products` },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `${siteUrl}/products?category=${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 4 : 3,
        name: product.name,
      },
    ],
  };

  const specs: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: FileText, label: "Format", value: product.fileFormat || "PDF" },
    ...(product.pageCount
      ? [{ icon: FileText, label: "Pages", value: `${product.pageCount} pages` }]
      : []),
    ...(product.paperSize
      ? [{ icon: Printer, label: "Paper size", value: product.paperSize }]
      : []),
    {
      icon: Download,
      label: "Delivery",
      value: "Instant download after payment",
    },
    { icon: Tag, label: "Licence", value: "Personal / classroom use" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10">
        <nav className="text-xs sm:text-sm text-ink-soft mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-berry">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/products" className="hover:text-berry">
            Shop
          </Link>
          {product.category && (
            <>
              <span className="mx-1.5">/</span>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-berry"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-1.5">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
          <div>
            <ProductGallery images={images} name={product.name} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-berry mb-2">
              <Download size={13} />
              PDF · INSTANT DOWNLOAD
              {product.productType === "BUNDLE" && (
                <span className="bg-marigold text-ink px-2 py-0.5 rounded-full">
                  BUNDLE · SAVE ₹{((bundleValue - product.price) / 100).toFixed(0)}
                </span>
              )}
            </div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-xs text-ink-soft hover:text-berry"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink mt-1">
              {product.name}
            </h1>

            {avgRating > 0 && (
              <div className="flex items-center mt-3">
                <span className="text-marigold" aria-hidden>
                  {"★".repeat(Math.round(avgRating))}
                  <span className="text-cream-dark">
                    {"★".repeat(5 - Math.round(avgRating))}
                  </span>
                </span>
                <span className="text-xs text-ink-soft ml-2">
                  {avgRating.toFixed(1)} · {product.reviews.length} review
                  {product.reviews.length === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-bold text-berry">
                ₹{(product.price / 100).toFixed(0)}
              </span>
              {product.compareAt && product.compareAt > product.price && (
                <>
                  <span className="text-lg text-ink-soft/60 line-through">
                    ₹{(product.compareAt / 100).toFixed(0)}
                  </span>
                  <span className="text-xs font-bold text-sage bg-sage/10 px-2 py-1 rounded-full">
                    {Math.round(
                      ((product.compareAt - product.price) / product.compareAt) * 100
                    )}
                    % OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-ink-soft/70 mt-1">
              Inclusive of all taxes · one-time payment
            </p>

            <p className="text-ink-soft mt-5 leading-relaxed">
              {product.description || "No description available."}
            </p>

            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: images[0] || null,
              }}
            />

            {/* What's inside */}
            {insideBullets.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl border border-cream-dark p-5">
                <h2 className="font-bold text-ink mb-3 font-display flex items-center gap-2">
                  <ListChecks size={16} className="text-berry" /> What&apos;s
                  inside
                </h2>
                <ul className="space-y-2">
                  {insideBullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm text-ink-soft"
                    >
                      <Sparkles size={14} className="text-marigold mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {specs.map((spec) => (
                <div key={spec.label} className="flex items-start gap-2.5">
                  <spec.icon size={16} className="text-berry mt-0.5" aria-hidden />
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-ink-soft/70">
                      {spec.label}
                    </dt>
                    <dd className="text-sm font-medium text-ink">{spec.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {/* Bundle contents */}
            {product.productType === "BUNDLE" && bundleProducts.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl border border-cream-dark p-5">
                <h2 className="font-bold text-ink mb-3 font-display flex items-center gap-2">
                  <Tag size={16} className="text-berry" /> What&apos;s included
                </h2>
                <ul className="space-y-2.5">
                  {bundleProducts.map((bp) => (
                    <li key={bp.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/products/${bp.slug}`}
                        className="text-sm text-ink hover:text-berry font-medium"
                      >
                        {bp.name}
                        {bp.pageCount ? (
                          <span className="text-ink-soft/70 font-normal">
                            {" "}
                            · {bp.pageCount} pp
                          </span>
                        ) : null}
                      </Link>
                      <span className="text-xs text-ink-soft line-through flex-shrink-0">
                        ₹{(bp.price / 100).toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 pt-3 border-t border-cream-dark text-sm text-ink-soft">
                  Total value{" "}
                  <span className="line-through">₹{(bundleValue / 100).toFixed(0)}</span>{" "}
                  — yours for{" "}
                  <span className="font-bold text-berry">
                    ₹{(product.price / 100).toFixed(0)}
                  </span>
                </p>
              </div>
            )}

            {/* Delivery info */}
            <div className="mt-8 space-y-3 border-t border-cream-dark pt-6">
              <h3 className="font-bold text-sm text-ink mb-3 font-display">
                How delivery works
              </h3>
              {[
                {
                  title: "Instant access",
                  text: "Download links appear on your order page and in your email the moment payment is confirmed.",
                },
                {
                  title: "Print at home",
                  text: product.printInstructions ||
                    "Print at 100% scale on A4 or US Letter paper.",
                },
                {
                  title: "Personal-use licence",
                  text: product.license ||
                    "Print unlimited copies for personal or classroom use. Do not resell or share the files.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 text-sm">
                  <span className="text-sage mt-0.5">✓</span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-ink-soft leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {product.license && (
              <details className="mt-4 text-sm text-ink-soft">
                <summary className="cursor-pointer font-semibold text-ink flex items-center gap-1">
                  <Scale size={14} /> Full licence terms
                </summary>
                <p className="mt-2 leading-relaxed">{product.license}</p>
              </details>
            )}
          </div>
        </div>

        <ProductSamplePreviews
          productId={product.id}
          productName={product.name}
        />

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-ink font-display">
                You may also like
              </h2>
              <Link
                href="/products"
                className="text-sm font-semibold text-berry hidden sm:flex items-center gap-1"
              >
                All printables <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <ReviewSection productId={product.id} />
      </div>
      <StickyBuyBar
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: images[0] || null,
        }}
      />
    </>
  );
}
