"use client";

import Link from "next/link";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { Trash2, ShoppingBag, Heart, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const addItem = useCart((s) => s.addItem);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
    });
    setAddedIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-6">
          <Link href="/account" className="hover:text-gray-900">My Account</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900">Wishlist</span>
        </nav>

        <div className="flex flex-col items-center justify-center py-16 sm:py-20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Heart size={32} className="text-gray-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
            Save items you love to your wishlist and come back to them anytime.
          </p>
          <Link
            href="/products"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-6">
        <Link href="/account" className="hover:text-gray-900">My Account</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Wishlist</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">My Wishlist ({items.length})</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group">
            <Link href={`/products/${item.slug}`} className="block">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No Image
                  </div>
                )}
              </div>
            </Link>

            <div className="p-3">
              <Link href={`/products/${item.slug}`}>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>
              </Link>
              <p className="text-sm font-bold text-blue-600 mt-1">
                ₹{(item.price / 100).toFixed(0)}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 min-h-[36px]"
                >
                  <ShoppingBag size={12} />
                  {addedIds.has(item.id) ? "Added!" : "Add to Cart"}
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
