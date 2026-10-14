"use client";

import { useCart } from "@/stores/cart";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Script from "next/script";
import Link from "next/link";
import { Check, Lock, ShoppingBag, Zap } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "order" | "payment" | "verify">("idle");
  const [error, setError] = useState("");
  const total = getTotal();

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const grandTotal = Math.max(0, total - discount);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);
  const phoneValid = /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10));
  const nameValid = form.name.trim().length >= 2;
  const detailsReady = nameValid && emailValid && phoneValid;
  const canPay = detailsReady && items.length > 0 && !loading;

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
        phone: prev.phone || (session.user?.phone as string) || "",
      }));
    }
  }, [session]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: total }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponSuccess(`Coupon applied — you save ₹${(data.discount / 100).toFixed(0)}!`);
      } else {
        setCouponError(data.error || "Invalid coupon");
        setDiscount(0);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Could not validate coupon — try again");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
  };

  function validDetails(): string | null {
    if (!form.name.trim() || form.name.trim().length < 2) return "Please enter your full name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return "Please enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
      return "Enter a valid 10-digit mobile number";
    }
    return null;
  }

  async function startPayment() {
    setError("");
    const detailError = validDetails();
    if (detailError) {
      setError(detailError);
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setPhase("order");
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: 1 })),
          customer: {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.replace(/\D/g, "").slice(-10),
          },
          couponCode: appliedCoupon || undefined,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Could not create order");
        setPhase("idle");
        return;
      }
      const orderNumber: string = orderData.orderNumber;

      setPhase("payment");
      const rzpRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        setError(rzpData.error || "Could not start payment");
        setPhase("idle");
        return;
      }

      const openModal = () => {
        const rzp = new window.Razorpay({
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: "GT Shopping",
          description: `${items.length} printable item${items.length === 1 ? "" : "s"}`,
          order_id: rzpData.orderId,
          prefill: {
            name: form.name.trim(),
            email: form.email.trim(),
            contact: form.phone.replace(/\D/g, "").slice(-10),
          },
          theme: { color: "#C2517E" },
          handler: async (response: any) => {
            setPhase("verify");
            try {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderNumber,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                clearCart();
                const t = verifyData.receiptToken
                  ? `&t=${encodeURIComponent(verifyData.receiptToken)}`
                  : "";
                window.location.href = `/order-confirmed?order=${orderNumber}${t}`;
              } else {
                setError(
                  verifyData.error ||
                    "Payment could not be verified. Your money is safe — use the contact link below if needed."
                );
                setPhase("idle");
              }
            } catch {
              setError(
                "Payment made but verification failed. Check My Downloads after signing in, or contact support."
              );
              setPhase("idle");
            }
          },
          modal: {
            ondismiss: () => {
              setError(
                `Payment cancelled. Your order ${orderNumber} is saved as pending — you can contact support to complete it.`
              );
              setPhase("idle");
            },
          },
        });
        rzp.open();
      };

      if (window.Razorpay) {
        openModal();
      } else {
        window.addEventListener("load", openModal, { once: true });
        setTimeout(() => {
          if (window.Razorpay) openModal();
        }, 1500);
      }
    } catch {
      setError("Something went wrong starting checkout — please try again");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={40} className="mx-auto text-cream-dark mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-3 font-display">
          Nothing to check out
        </h1>
        <p className="text-ink-soft text-sm mb-6">
          Add some printables to your cart first.
        </p>
        <Link
          href="/products"
          className="inline-flex bg-berry text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-berry-dark"
        >
          Shop printables
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1 font-display">
          Checkout
        </h1>
        <p className="text-ink-soft text-sm mb-8 flex items-center gap-1.5">
          <Zap size={14} className="text-berry" /> Your PDFs unlock the moment
          payment completes
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h2 className="font-bold text-ink mb-4 font-display">
                1. Your details
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Full name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-berry"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Email — download links are sent here *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-cream border border-cream-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-berry"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Mobile number *
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-cream border border-r-0 border-cream-dark rounded-l-xl text-sm text-ink-soft">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="flex-1 w-full px-4 py-2.5 bg-cream border border-cream-dark rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-berry"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h2 className="font-bold text-ink mb-4 font-display">
                2. Coupon code
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-sage/10 border border-sage/30 rounded-xl px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-sage">
                    <Check size={15} /> {appliedCoupon} applied
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-ink-soft hover:text-berry-dark underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="flex-1 px-4 py-2.5 bg-cream border border-cream-dark rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-berry"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-5 py-2.5 bg-ink text-cream rounded-xl text-sm font-semibold hover:bg-berry transition-colors disabled:opacity-50"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {couponSuccess && (
                <p className="text-xs text-sage mt-2">{couponSuccess}</p>
              )}
              {couponError && (
                <p className="text-xs text-berry-dark mt-2">{couponError}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h2 className="font-bold text-ink mb-3 font-display">
                3. Delivery
              </h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                All products are digital PDFs — nothing is shipped. After
                payment you&apos;ll get instant download links on the
                confirmation page and by email, plus access anytime under{" "}
                <Link href="/account/downloads" className="text-berry font-semibold hover:underline">
                  My Downloads
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-cream-dark p-6 sticky top-28">
              <h2 className="font-bold text-ink mb-4 font-display">
                Order summary
              </h2>
              <ul className="space-y-3 mb-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="w-12 h-14 rounded-lg bg-cream-dark overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-ink-soft">PDF · 1 copy</p>
                    </div>
                    <span className="text-xs font-semibold text-ink flex-shrink-0">
                      ₹{(item.price / 100).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-cream-dark pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Subtotal</span>
                  <span>₹{(total / 100).toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sage">
                    <span>Discount ({appliedCoupon})</span>
                    <span>− ₹{(discount / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-soft">Delivery</span>
                  <span className="text-sage font-semibold">Instant · free</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-cream-dark">
                  <span>Total</span>
                  <span className="text-berry">₹{(grandTotal / 100).toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={startPayment}
                disabled={!canPay}
                className="w-full bg-berry text-white py-3.5 rounded-full font-semibold mt-6 hover:bg-berry-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-berry/20 min-h-[48px]"
              >
                <Lock size={16} />
                {phase === "order"
                  ? "Preparing order…"
                  : phase === "payment"
                    ? "Opening payment…"
                    : phase === "verify"
                      ? "Confirming payment…"
                      : `Pay ₹${(grandTotal / 100).toFixed(0)} securely`}
              </button>
              {!detailsReady && !error && (
                <p className="text-xs text-ink-soft text-center mt-2">
                  Enter your full name, email and mobile number to continue
                </p>
              )}

              {error && (
                <div className="mt-4 bg-berry/5 border border-berry/20 rounded-xl p-3">
                  <p className="text-xs text-berry-dark leading-relaxed">{error}</p>
                  <Link
                    href="/contact"
                    className="text-xs text-berry font-semibold underline mt-1 inline-block"
                  >
                    Contact support
                  </Link>
                </div>
              )}

              <p className="text-[11px] text-ink-soft text-center mt-4 leading-relaxed">
                Payments processed by Razorpay. We never see or store your card
                details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
