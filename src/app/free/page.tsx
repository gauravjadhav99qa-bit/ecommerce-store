import Link from "next/link";
import { Download, Sparkles, Printer, ArrowRight } from "lucide-react";
import { COLOURING_KEYS } from "@/lib/colouring-pages";
import { buildColouringSvg } from "@/lib/colouring-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free printable colouring pages — sample download",
  description:
    "Download free printable colouring pages from GT Shopping. Original artwork, thick outlines, A4 & US Letter ready. No signup required.",
  alternates: { canonical: "https://www.gtshoppingonline.in/free" },
};

const SAMPLES = [
  { key: "cat", title: "Friendly Cat", blurb: "Big shapes, perfect for ages 3–5" },
  { key: "butterfly", title: "Butterfly", blurb: "Symmetry fun for small hands" },
  { key: "unicorn", title: "Unicorn", blurb: "A favourite for imaginative kids" },
  { key: "car", title: "Speedy Car", blurb: "Vehicle lovers will enjoy this one" },
  { key: "flower", title: "Happy Flower", blurb: "Simple petals, easy to colour" },
  { key: "rocket", title: "Space Rocket", blurb: "Blast off with bold outlines" },
] as const;

export default function FreeSamplesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <nav className="text-xs sm:text-sm text-ink-soft mb-4 sm:mb-6">
        <Link href="/" className="hover:text-berry">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Free samples</span>
      </nav>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 bg-berry/10 text-berry text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          <Sparkles size={13} /> Completely free
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3 font-display">
          Free printable colouring pages
        </h1>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
          Try our artwork before you buy. Download any page below — print at
          home on A4 or US Letter. No signup, no email required.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {SAMPLES.map((sample) => {
          const svg = buildColouringSvg(sample.key);
          return (
            <div
              key={sample.key}
              className="bg-white rounded-2xl border border-cream-dark p-4 flex flex-col"
            >
              <div
                className="rounded-xl overflow-hidden border border-cream-dark/50 bg-white mb-3"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: svg.replace(
                    'width="800" height="1000"',
                    'width="100%" height="auto"'
                  ),
                }}
              />
              <h2 className="font-bold text-sm text-ink">{sample.title}</h2>
              <p className="text-[11px] text-ink-soft mt-0.5 mb-3 flex-1">
                {sample.blurb}
              </p>
              <a
                href={`/api/samples/${sample.key}.pdf`}
                download={`gt-shopping-${sample.key}.pdf`}
                className="inline-flex items-center justify-center gap-1.5 bg-ink text-cream px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-berry transition-colors min-h-[40px]"
              >
                <Download size={14} /> Free PDF
              </a>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-white rounded-2xl border border-cream-dark p-6 sm:p-8 text-center">
        <Printer size={28} className="mx-auto text-berry mb-3" />
        <h2 className="text-xl sm:text-2xl font-bold text-ink font-display mb-2">
          Ready for the full book?
        </h2>
        <p className="text-ink-soft text-sm mb-6 max-w-md mx-auto">
          Every full colouring book has 20–60 pages of original artwork, print
          instructions, and unlimited personal printing.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-berry text-white px-8 py-3.5 rounded-full font-semibold hover:bg-berry-dark transition-colors text-sm shadow-lg shadow-berry/20"
        >
          Browse all printables <ArrowRight size={16} />
        </Link>
      </div>

      <p className="text-center text-[11px] text-ink-soft/70 mt-8">
        Free pages are for personal use. Full books:{" "}
        <Link href="/products" className="text-berry font-semibold hover:underline">
          shop printables
        </Link>
        . All artwork © GT Shopping — {COLOURING_KEYS.length} original designs
        in the library.
      </p>
    </div>
  );
}
