"use client";

import { useCart } from "@/stores/cart";
import { ShoppingBag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();

  const handleAdd = () => {
    addItem(product, 1);
    router.push("/cart");
  };

  const handleBuyNow = () => {
    addItem(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="mt-6 sm:mt-8 space-y-3">
      <button
        onClick={handleBuyNow}
        className="w-full bg-berry text-white py-3.5 px-6 rounded-full font-semibold hover:bg-berry-dark transition-colors flex items-center justify-center gap-2 min-h-[48px] shadow-lg shadow-berry/20"
      >
        <Zap size={18} />
        Buy now — instant download
      </button>
      <button
        onClick={handleAdd}
        className="w-full border-2 border-ink/15 text-ink py-3.5 px-6 rounded-full font-semibold hover:border-berry hover:text-berry transition-colors flex items-center justify-center gap-2 min-h-[48px]"
      >
        <ShoppingBag size={18} />
        Add to cart
      </button>
    </div>
  );
}
