"use client";

import Link from "next/link";
import { useCart } from "@/stores/cart";
import { ShoppingBag, Heart, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseImages } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAt?: number | null;
    images: string | string[];
    pageCount?: number | null;
    paperSize?: string | null;
    productType?: string;
    category?: { name: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlist();
  const images = parseImages(product.images);
  const inWishlist = isInWishlist(product.id);
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0] || null,
    });
    router.push("/cart");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0] || null,
    });
  };

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(
          ((product.compareAt - product.price) / product.compareAt) * 100
        )
      : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[4/5] bg-cream rounded-2xl overflow-hidden relative border border-cream-dark">
        {images[0] ? (
          <img
            src={images[0]}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-soft/40 text-xs">
            Preview
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-berry text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
        {product.productType === "BUNDLE" && (
          <span className="absolute top-2 right-11 bg-marigold text-ink text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
            BUNDLE
          </span>
        )}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 bg-white/85 backdrop-blur-sm p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow"
          aria-label="Add to wishlist"
        >
          <Heart
            size={14}
            className={inWishlist ? "text-berry fill-berry" : "text-ink-soft"}
          />
        </button>
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-ink text-cream p-2 sm:p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-berry shadow-lg"
          aria-label="Add to cart"
        >
          <ShoppingBag size={14} />
        </button>
      </div>
      <div className="mt-2.5 sm:mt-3 px-0.5">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-ink-soft/80">
          <Download size={11} className="text-berry" />
          <span>PDF · Instant download</span>
          {product.pageCount ? <span>· {product.pageCount} pp</span> : null}
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-ink line-clamp-2 mt-1 group-hover:text-berry transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
          <span className="text-sm sm:text-base font-bold text-berry">
            ₹{(product.price / 100).toFixed(0)}
          </span>
          {product.compareAt && product.compareAt > product.price && (
            <span className="text-xs sm:text-sm text-ink-soft/60 line-through">
              ₹{(product.compareAt / 100).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
