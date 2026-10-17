/** Shows real interior sample pages (skips the designed cover at index 0). */
export default function ProductSamplePreviews({
  productName,
  images,
}: {
  productName: string;
  images: string[];
}) {
  // images[0] is the designed cover; interior pages start at 1.
  const pages = images.slice(1, 4);
  if (pages.length === 0) return null;
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
        {pages.map((src, i) => (
          <figure
            key={`${src}-${i}`}
            className="bg-white rounded-2xl border border-cream-dark p-3 shadow-sm"
          >
            <div className="rounded-xl overflow-hidden border border-cream-dark/60 bg-white aspect-[2480/3508]">
              <img
                src={src}
                alt={`${productName} — sample page ${i + 1}`}
                className="w-full h-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <figcaption className="text-[11px] text-ink-soft/70 text-center mt-2">
              {productName} · page sample {i + 1}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
