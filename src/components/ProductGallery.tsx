"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const thumbRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setSelected((prev) => (prev + dir + total) % total);
    },
    [total]
  );

  // Keep the active thumbnail in view when selection changes (scroll strip).
  useEffect(() => {
    const el = thumbRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selected]);

  if (total === 0) {
    return (
      <div className="aspect-[2480/3508] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No Image Available
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null) return;
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1);
  };

  return (
    <div
      className="select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className="relative aspect-[2480/3508] bg-cream rounded-lg overflow-hidden flex items-center justify-center touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[selected]}
          alt={`${name} — image ${selected + 1} of ${total}`}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-ink"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-ink"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    selected === i ? "bg-berry" : "bg-ink/25"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          ref={thumbRef}
          className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              className={`snap-center shrink-0 w-14 h-20 sm:w-16 sm:h-[90px] bg-cream rounded-lg overflow-hidden border-2 transition-colors ${
                selected === i ? "border-berry" : "border-transparent hover:border-cream-dark"
              }`}
            >
              <img
                src={img}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
