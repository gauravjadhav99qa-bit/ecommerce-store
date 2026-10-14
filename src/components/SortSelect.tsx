"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      aria-label="Sort products"
      value={value}
      onChange={(e) => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("sort", e.target.value);
        sp.delete("page");
        router.push(`/products?${sp.toString()}`);
      }}
      className="text-sm border border-cream-dark bg-white rounded-lg px-2 py-1.5 text-ink"
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
    </select>
  );
}
