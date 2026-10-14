"use client";

import { useEffect, useState } from "react";
import { Zap, ShoppingBag } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useRouter } from "next/navigation";

interface StickyBuyBarProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  };
}

/** Mobile-only sticky bottom bar with price + buy CTA on product pages. */
export default function StickyBuyBar({ product }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const handleBuy = () => {
    addItem(product, 1);
    router.push("/checkout");
  };

  const handleCart = () => {
    addItem(product, 1);
    router.push("/cart");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-cream-dark shadow-[0_-4px_20px_rgba(43,33,24,0.08)] px-4 py-3 safe-area-pb">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-soft truncate">{product.name}</p>
          <p className="text-lg font-bold text-berry leading-tight">
            ₹{(product.price / 100).toFixed(0)}
            <span className="text-[10px] text-ink-soft/70 font-medium ml-1">
              incl. taxes
            </span>
          </p>
        </div>
        <button
          onClick={handleCart}
          className="p-3 rounded-full border-2 border-ink/10 text-ink"
          aria-label="Add to cart"
        >
          <ShoppingBag size={18} />
        </button>
        <button
          onClick={handleBuy}
          className="flex items-center gap-1.5 bg-berry text-white px-5 py-3 rounded-full font-semibold text-sm shadow-lg shadow-berry/20 min-h-[44px]"
        >
          <Zap size={16} /> Buy now
        </button>
      </div>
    </div>
  );
}
