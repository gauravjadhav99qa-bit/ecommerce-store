"use client";

import { useCart } from "@/stores/cart";
import Link from "next/link";
import { Trash2, ShoppingBag, Download, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, getTotal, clearCart } = useCart();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <ShoppingBag size={44} className="mx-auto text-cream-dark mb-5" />
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-3 font-display">
          Your cart is empty
        </h1>
        <p className="text-ink-soft text-sm mb-8">
          Browse our printable colouring books, activity worksheets and planners.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-berry text-white px-8 py-3.5 rounded-full font-semibold hover:bg-berry-dark transition-colors text-sm"
        >
          Shop printables <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-display">
            Your cart
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1 flex items-center gap-1.5">
            <Download size={13} className="text-berry" /> Digital products —
            delivered instantly after payment
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-ink-soft hover:text-berry min-h-[44px] px-2"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-white rounded-2xl border border-cream-dark"
            >
              <div className="w-20 h-24 bg-cream-dark rounded-xl overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-soft/40 text-xs">
                    PDF
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-semibold text-sm text-ink hover:text-berry line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                  <Download size={11} className="text-berry" /> PDF · instant
                  download
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-bold text-berry">
                    ₹{(item.price / 100).toFixed(0)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-ink-soft hover:text-berry-dark p-2"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white p-6 rounded-2xl border border-cream-dark sticky top-28">
            <h2 className="font-bold text-lg text-ink mb-4 font-display">
              Order summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-semibold text-ink">
                  ₹{(total / 100).toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Delivery</span>
                <span className="font-semibold text-sage">Instant · free</span>
              </div>
              <div className="border-t border-cream-dark pt-3 flex justify-between text-base">
                <span className="font-bold text-ink">Total</span>
                <span className="font-bold text-berry">
                  ₹{(total / 100).toFixed(0)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-berry text-white text-center py-3.5 rounded-full font-semibold mt-6 hover:bg-berry-dark transition-colors text-sm shadow-lg shadow-berry/20"
            >
              Checkout securely
            </Link>
            <p className="text-[11px] text-ink-soft text-center mt-3">
              Coupon codes can be applied at checkout.
            </p>
            <Link
              href="/products"
              className="block text-center text-ink-soft hover:text-berry text-sm mt-4"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
