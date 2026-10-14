"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, PackageOpen } from "lucide-react";

type OrderDownloads = {
  orderNumber: string;
  paidAt: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    image: string | null;
    files: { id: string; fileName: string; sizeBytes: number; url: string }[];
  }[];
};

export default function MyDownloadsPage() {
  const [orders, setOrders] = useState<OrderDownloads[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/orders");
      if (cancelled) return;
      if (!res.ok) {
        setError("Please sign in to view your downloads.");
        setLoading(false);
        return;
      }
      const allOrders: any[] = await res.json();
      const paidDigital = allOrders.filter(
        (o) => o.paidAt && o.items?.some((i: any) => i.isDigital)
      );

      const detailed: OrderDownloads[] = [];
      for (const order of paidDigital) {
        const dl = await fetch(`/api/downloads/${order.orderNumber}`);
        if (dl.ok) {
          detailed.push(await dl.json());
        }
      }
      if (!cancelled) {
        setOrders(detailed);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1 font-display">
        My downloads
      </h1>
      <p className="text-ink-soft text-sm mb-8">
        Every printable you&apos;ve purchased, with fresh download links.
      </p>

      {loading && (
        <p className="text-ink-soft text-sm py-10 text-center">Loading…</p>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-cream-dark p-8 text-center">
          <p className="text-ink font-semibold mb-3">{error}</p>
          <Link
            href="/login?callbackUrl=/account/downloads"
            className="inline-flex bg-berry text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-berry-dark"
          >
            Sign in
          </Link>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-cream-dark p-10 text-center">
          <PackageOpen size={32} className="mx-auto text-cream-dark mb-4" />
          <p className="text-ink font-semibold mb-2">No downloads yet</p>
          <p className="text-ink-soft text-sm mb-6">
            Your purchased printables will appear here after checkout.
          </p>
          <Link
            href="/products"
            className="inline-flex bg-berry text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-berry-dark"
          >
            Shop printables
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="bg-white rounded-2xl border border-cream-dark p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-dark">
                <div>
                  <p className="font-semibold text-ink text-sm">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {order.paidAt
                      ? new Date(order.paidAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-1 rounded-full">
                  PAID
                </span>
              </div>
              <ul className="space-y-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-14 h-16 rounded-lg object-cover border border-cream-dark flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-16 rounded-lg bg-cream-dark flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {item.files.length} file{item.files.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          download
                          className="inline-flex items-center gap-1.5 bg-cream hover:bg-cream-dark border border-cream-dark rounded-full px-3.5 py-1.5 text-xs font-semibold text-berry transition-colors"
                        >
                          {file.fileName.length > 28
                            ? `${file.fileName.slice(0, 25)}…`
                            : file.fileName}
                          <Download size={12} />
                        </a>
                      ))}
                      {item.files.length === 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                          <FileText size={12} /> No files
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink-soft text-center">
            Download links are short-lived and regenerate each page load.
          </p>
        </div>
      )}
    </div>
  );
}
