"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No Image Available
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square bg-cream rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={images[selected]}
          alt={name}
          className="w-full h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-3 sm:mt-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`aspect-square bg-cream rounded-lg overflow-hidden border-2 transition-colors ${
                selected === i ? "border-berry" : "border-transparent hover:border-cream-dark"
              }`}
            >
              <img
                src={img}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
