import { buildColouringSvg, pickPages } from "@/lib/colouring-pages";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Renders 3 original interior sample pages as inline SVGs for a product. */
export default function ProductSamplePreviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const keys = pickPages(hashSeed(productId), 3);
  return (
    <section className="mt-12 sm:mt-16" aria-label="Sample pages">
      <div className="text-center mb-6">
        <span className="text-berry text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
          Peek inside
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-ink font-display">
          Sample pages from this book
        </h2>
        <p className="text-ink-soft text-sm mt-1">
          Thick outlines · print-ready · original artwork
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {keys.map((key, i) => (
          <figure
            key={`${key}-${i}`}
            className="bg-white rounded-2xl border border-cream-dark p-3 shadow-sm"
          >
            <div
              className="rounded-xl overflow-hidden border border-cream-dark/60 bg-white"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: buildColouringSvg(key).replace(
                  'width="800" height="1000"',
                  'width="100%" height="auto"'
                ),
              }}
            />
            <figcaption className="text-[11px] text-ink-soft/70 text-center mt-2">
              {productName} · page sample {i + 1}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
