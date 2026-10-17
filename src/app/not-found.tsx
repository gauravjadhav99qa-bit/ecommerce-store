import Link from "next/link";
import { Search, ArrowRight, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-6 border border-cream-dark">
        <FileQuestion size={30} className="text-berry" />
      </div>
      <p className="text-xs font-bold tracking-[0.25em] uppercase text-berry mb-3">
        404
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3 font-display">
        This page went missing
      </h1>
      <p className="text-ink-soft text-sm mb-8 max-w-md mx-auto leading-relaxed">
        The link may be old, or the page has moved. Try searching our printables
        or jump back to the shop.
      </p>

      <form
        action="/products"
        method="get"
        className="relative max-w-sm mx-auto mb-8"
      >
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
        />
        <input
          type="text"
          name="search"
          placeholder="Search colouring books, worksheets..."
          className="w-full pl-9 pr-4 py-3 bg-white border border-cream-dark rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-berry"
        />
      </form>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-berry text-white px-7 py-3 rounded-full font-semibold hover:bg-berry-dark transition-colors text-sm"
        >
          Browse shop <ArrowRight size={15} />
        </Link>
        <Link
          href="/free"
          className="inline-flex items-center gap-2 border-2 border-ink/15 text-ink px-7 py-3 rounded-full font-semibold hover:border-berry hover:text-berry transition-colors text-sm"
        >
          Free samples
        </Link>
      </div>

      <div className="mt-12 text-left">
        <h2 className="text-sm font-bold text-ink mb-3">Popular right now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { href: "/products?featured=1", label: "Bestsellers" },
            { href: "/products?age=3-5", label: "Kids colouring" },
            { href: "/products?category=bundles", label: "Bundle deals" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-white border border-cream-dark rounded-xl px-4 py-3 text-sm font-medium text-ink hover:border-berry/40 hover:text-berry transition-colors text-center"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
