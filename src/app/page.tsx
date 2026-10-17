import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import {
  Download,
  Printer,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  Star,
  Heart,
  Mail,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_EMOJI: Record<string, string> = {
  animals: "🐾",
  sports: "⚽",
  "world-cultures": "🌍",
  holidays: "🎉",
  mythology: "🏛️",
  fantasy: "🦄",
  "everyday-objects": "🏠",
  vehicles: "🚗",
  nature: "🌳",
  geography: "🗺️",
  alphabet: "🔤",
  activities: "🧩",
  "people-family": "👨‍👩‍👧",
  food: "🍕",
  seasons: "🍂",
  dinosaurs: "🦕",
  numbers: "🔢",
  jobs: "🧑‍🚒",
  religious: "🕊️",
  music: "🎵",
  space: "🚀",
  ocean: "🐟",
  aesthetics: "💄",
  educational: "📖",
  science: "🔬",
  flowers: "🌸",
  "adult-relaxation": "🧘",
  "emotions-sel": "💛",
  mandalas: "🎡",
  shapes: "🔷",
  "bugs-insects": "🦋",
  history: "📜",
  patterns: "🌀",
  personalized: "✏️",
  bundles: "🎁",
};

const FAQS = [
  {
    q: "How do I receive my files after paying?",
    a: "Instantly. As soon as your payment is confirmed you get a download link on the order confirmation page, plus an email with the same links. You can also find every purchase anytime under My Downloads in your account.",
  },
  {
    q: "What paper size do the printables use?",
    a: "Most books are provided for both A4 and US Letter. The exact paper size for each product is listed on its page. Print at 100% scale ('Actual size') for best results.",
  },
  {
    q: "Can I print the pages more than once?",
    a: "Yes. Your purchase includes unlimited personal printing — print a page again if it gets scribbled on, or print a whole book for your classroom (personal/classroom use). The digital files themselves cannot be shared or resold.",
  },
  {
    q: "What file format will I receive?",
    a: "PDF files that open on any phone, tablet or computer with a free PDF reader. No special software needed.",
  },
  {
    q: "Do you offer refunds?",
    a: "Because downloads are delivered instantly, we generally can't offer refunds once files are accessed. If you have any problem with your order, contact us — we'll make it right.",
  },
];

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true, isDigital: true, featured: true },
    take: 8,
    orderBy: { price: "asc" },
  });

  const newArrivals = await prisma.product.findMany({
    where: { isActive: true, isDigital: true, productType: "SINGLE" },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const bundles = await prisma.product.findMany({
    where: { isActive: true, isDigital: true, productType: "BUNDLE" },
    take: 4,
    orderBy: { compareAt: "desc" },
  });

  const kidsProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isDigital: true,
      OR: [
        { tags: { contains: "age:2-4", mode: "insensitive" } },
        { tags: { contains: "age:5-8", mode: "insensitive" } },
      ],
    },
    take: 4,
    orderBy: { featured: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { products: { some: { isActive: true, isDigital: true } } },
    orderBy: { name: "asc" },
  });

  const reviews = await prisma.review.findMany({
    where: { product: { isActive: true, isDigital: true } },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, firstName: true } } },
  });

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFE9F2] via-[#FFF7E6] to-[#E8F5E9]">
        <div className="absolute top-8 left-6 text-3xl opacity-40 animate-bounce hidden sm:block" aria-hidden>🎨</div>
        <div className="absolute top-16 right-10 text-3xl opacity-40 hidden sm:block" aria-hidden>🖍️</div>
        <div className="absolute bottom-10 left-1/3 text-3xl opacity-40 hidden sm:block" aria-hidden>✏️</div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-1.5 bg-marigold/20 text-[#B26A00] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <Sparkles size={13} /> Printable PDFs · Instant download
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-ink mb-5 leading-[1.08]">
                Colour, learn and
                <span className="block bg-gradient-to-r from-berry via-[#E0568C] to-marigold bg-clip-text text-transparent">play — at home</span>
              </h1>
              <p className="text-ink-soft text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
                Printable colouring books, kids&apos; activity books, worksheets
                and planners. Pay once, download instantly, print as many times
                as you like.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-berry text-white px-8 py-3.5 font-semibold hover:bg-berry-dark transition-colors rounded-full text-sm shadow-lg shadow-berry/20"
                >
                  Shop printables <ArrowRight size={16} />
                </Link>
                <Link
                  href="/products?category=bundles"
                  className="inline-flex items-center gap-2 border-2 border-marigold text-[#B26A00] bg-marigold/10 px-8 py-3.5 font-semibold hover:bg-marigold hover:text-ink transition-colors rounded-full text-sm"
                >
                  🎁 Bundle deals
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative w-[420px] h-[380px]">
                {featured.slice(0, 3).map((p, i) => {
                  const img = parseImages(p.images)[0];
                  const rotations = ["-rotate-6", "rotate-3", "rotate-12"];
                  const offsets = ["left-0 top-8", "left-28 top-0", "left-56 top-12"];
                  return (
                    <div
                      key={p.id}
                      className={`absolute ${offsets[i]} w-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white ${rotations[i]}`}
                    >
                      {img ? (
                        <img src={img} alt={p.name} className="w-full h-auto" />
                      ) : null}
                    </div>
                  );
                })}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-5 py-2.5 flex items-center gap-2">
                  <Download size={16} className="text-berry" />
                  <span className="text-sm font-bold text-ink">
                    Ready in seconds
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-cream-dark bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-cream-dark">
            {[
              { icon: Download, label: "Instant download", sub: "Right after payment" },
              { icon: Printer, label: "Print at home", sub: "A4 & US Letter" },
              { icon: FileText, label: "PDF format", sub: "Works on any device" },
              { icon: ShieldCheck, label: "Secure checkout", sub: "Razorpay payments" },
            ].map((badge) => (
              <div key={badge.label} className="py-5 md:py-6 text-center px-2">
                <badge.icon
                  size={22}
                  className="mx-auto mb-1.5 text-berry"
                  aria-hidden
                />
                <p className="text-xs font-bold text-ink">{badge.label}</p>
                <p className="text-[11px] text-ink-soft/70 mt-0.5">{badge.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-berry text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                Browse by category
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                Find the perfect printable
              </h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-berry hover:text-berry-dark hidden sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {categories.slice(0, 10).map((cat, idx) => {
              const tiles = [
                "from-[#FFE0EC] to-[#FFF0F5] hover:from-[#FFD1E3] hover:to-[#FFE6F0]",
                "from-[#FFF3D6] to-[#FFF9EC] hover:from-[#FFE9B8] hover:to-[#FFF4D9]",
                "from-[#E0F2E1] to-[#F0F9F0] hover:from-[#CDE9CF] hover:to-[#E5F4E6]",
                "from-[#E3F0FF] to-[#F0F7FF] hover:from-[#CFE4FF] hover:to-[#E5F1FF]",
                "from-[#F3E5FF] to-[#FAF3FF] hover:from-[#E8D4FF] hover:to-[#F5EBFF]",
                "from-[#FFE9D9] to-[#FFF5EE] hover:from-[#FFDCC2] hover:to-[#FFEEE2]",
              ];
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`group bg-gradient-to-br ${tiles[idx % tiles.length]} rounded-2xl border border-white p-4 sm:p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                >
                  <span className="text-3xl sm:text-4xl block mb-2 group-hover:scale-110 transition-transform">
                    {CATEGORY_EMOJI[cat.slug] || "📄"}
                  </span>
                  <span className="text-xs font-semibold text-ink leading-tight block line-clamp-2 group-hover:text-berry transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offers marquee */}
      <section className="py-3 bg-marigold/15 overflow-hidden border-y border-marigold/25">
        <div className="flex animate-scroll-left gap-4 w-max">
          {[...Array(2)].map((_, dup) =>
            [
              { text: "Bundle deals save up to 35%", icon: "🎁" },
              { text: "Instant PDF download after payment", icon: "⚡" },
              { text: "Print unlimited copies at home", icon: "🖨️" },
              { text: "New colouring books added every month", icon: "✨" },
              { text: "Works with A4 and US Letter paper", icon: "📄" },
            ].map((promo, i) => (
              <div
                key={`${dup}-${i}`}
                className="flex-shrink-0 bg-white border border-marigold/30 rounded-full px-5 py-2 flex items-center gap-2"
              >
                <span>{promo.icon}</span>
                <span className="text-sm font-medium text-ink">{promo.text}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bestsellers */}
      {featured.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-berry text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                  Bestsellers
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                  Loved by parents &amp; teachers
                </h2>
              </div>
              <Link
                href="/products?featured=1"
                className="text-sm font-semibold text-berry hover:text-berry-dark hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Kids section */}
      {kidsProducts.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-y border-cream-dark">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-sage text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                  For little learners
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                  Kids&apos; activity &amp; worksheets
                </h2>
              </div>
              <Link
                href="/products?age=3-5"
                className="text-sm font-semibold text-berry hover:text-berry-dark hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {kidsProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-berry text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                  Fresh off the press
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                  New arrivals
                </h2>
              </div>
              <Link
                href="/products?sort=newest"
                className="text-sm font-semibold text-berry hover:text-berry-dark hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bundles */}
      {bundles.length > 0 && (
        <section className="py-14 sm:py-20 bg-gradient-to-br from-berry/5 via-cream to-marigold/10 border-y border-cream-dark">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-berry text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                  Save more with bundles
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                  Bundles &amp; collections
                </h2>
              </div>
              <Link
                href="/products?category=bundles"
                className="text-sm font-semibold text-berry hover:text-berry-dark hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {bundles.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-14 sm:py-20 bg-white border-y border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Why print with GT Shopping?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Download,
                title: "No waiting for delivery",
                desc: "Your PDF is available the second payment completes — start printing in under a minute.",
              },
              {
                icon: Printer,
                title: "Print as often as you like",
                desc: "Made a mistake? Print the page again. Every purchase includes unlimited personal printing.",
              },
              {
                icon: Heart,
                title: "Made for real family life",
                desc: "Thick outlines for small hands, calming mandalas for grown-ups, and homework-ready worksheets.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-cream rounded-2xl p-6 border border-cream-dark"
              >
                <item.icon size={24} className="text-berry mb-3" aria-hidden />
                <h3 className="font-bold text-ink mb-1.5 font-display">
                  {item.title}
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews (genuine only) */}
      {reviews.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                What customers say
              </h2>
              <p className="text-ink-soft mt-2 text-sm">
                Reviews from verified purchases
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-5 border border-cream-dark"
                >
                  <div className="flex gap-0.5 mb-3" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={15}
                        className={
                          j < review.rating
                            ? "fill-marigold text-marigold"
                            : "text-cream-dark"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-ink-soft text-sm leading-relaxed mb-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <p className="text-xs font-semibold text-ink">
                    {review.user?.firstName || review.user?.name || "Customer"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 sm:py-20 bg-white border-t border-cream-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-cream rounded-xl border border-cream-dark overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink flex items-center justify-between">
                  {faq.q}
                  <span className="text-berry group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm text-ink-soft leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-ink-soft">
            More questions?{" "}
            <Link href="/contact" className="text-berry font-semibold hover:underline">
              Contact us
            </Link>{" "}
            or see our{" "}
            <Link href="/faq" className="text-berry font-semibold hover:underline">
              full FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Newsletter band */}
      <section className="py-12 sm:py-16 bg-ink">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail size={28} className="mx-auto text-marigold mb-3" aria-hidden />
          <h2 className="text-2xl sm:text-3xl font-bold text-cream mb-2 font-display">
            New printables, straight to your inbox
          </h2>
          <p className="text-cream/60 text-sm mb-6">
            Be first to know about new colouring books, seasonal pages and
            bundle offers. Unsubscribe anytime.
          </p>
          <a
            href="#newsletter"
            className="inline-flex items-center gap-2 bg-berry text-white px-8 py-3.5 font-semibold hover:bg-berry-dark transition-colors rounded-full text-sm"
          >
            Subscribe below
          </a>
        </div>
      </section>
    </div>
  );
}
