"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Mail, ArrowRight } from "lucide-react";

function OrderConfirmedInner() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const token = searchParams.get("t");

  const downloadHref = orderNumber
    ? `/download/${orderNumber}${token ? `?t=${encodeURIComponent(token)}` : ""}`
    : "/account/downloads";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={34} className="text-sage" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3 font-display">
        Payment successful!
      </h1>
      {orderNumber && (
        <p className="text-ink-soft text-sm mb-1">
          Order <span className="font-semibold text-ink">{orderNumber}</span>
        </p>
      )}
      <p className="text-ink-soft text-sm mb-8 max-w-md mx-auto leading-relaxed">
        Your printables are ready. Download them now, or anytime later from My
        Downloads after signing in with your email.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
        <Link
          href={downloadHref}
          className="inline-flex items-center gap-2 bg-berry text-white px-8 py-3.5 rounded-full font-semibold hover:bg-berry-dark transition-colors text-sm shadow-lg shadow-berry/20 min-h-[48px]"
        >
          <Download size={17} /> Download your files
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 border-2 border-ink/15 text-ink px-8 py-3.5 rounded-full font-semibold hover:border-berry hover:text-berry transition-colors text-sm"
        >
          Keep browsing <ArrowRight size={15} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-cream-dark p-5 text-left">
        <p className="flex items-start gap-2.5 text-sm text-ink-soft leading-relaxed">
          <Mail size={16} className="text-berry mt-0.5 flex-shrink-0" />
          <span>
            A receipt with your download links was sent to your email. Links
            also live under{" "}
            <Link href="/account/downloads" className="text-berry font-semibold hover:underline">
              My Downloads
            </Link>{" "}
            — sign in with the same email you used at checkout.
          </span>
        </p>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-ink-soft text-sm">
          Loading…
        </div>
      }
    >
      <OrderConfirmedInner />
    </Suspense>
  );
}
