"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Download, FileText, LogIn, ShieldAlert } from "lucide-react";

type FileRow = {
  id: string;
  fileName: string;
  sizeBytes: number;
  url: string;
};
type ItemRow = {
  id: string;
  name: string;
  image: string | null;
  files: FileRow[];
};

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DownloadPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderNumber } = use(params);
  const { t } = use(searchParams);
  const [data, setData] = useState<{
    items: ItemRow[];
    status: string;
    paidAt: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const qs = t ? `?t=${encodeURIComponent(t)}` : "";
      const res = await fetch(`/api/downloads/${orderNumber}${qs}`);
      if (cancelled) return;
      if (res.ok) {
        setData(await res.json());
        setError(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Not authorized");
        setData(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, t]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-berry/10 flex items-center justify-center mx-auto mb-4">
          <Download size={26} className="text-berry" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-display">
          Your downloads
        </h1>
        <p className="text-ink-soft text-sm mt-2">
          Order {orderNumber} · links are time-limited for your security
        </p>
      </div>

      {loading && (
        <p className="text-center text-ink-soft text-sm py-10">Loading your files…</p>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-cream-dark p-8 text-center">
          <ShieldAlert size={28} className="mx-auto text-marigold mb-3" />
          <p className="text-ink font-semibold mb-1">{error}</p>
          <p className="text-ink-soft text-sm mb-6">
            Sign in with the email you used at checkout to access your purchase.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/download/${orderNumber}${t ? `?t=${t}` : ""}`)}`}
            className="inline-flex items-center gap-2 bg-berry text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-berry-dark transition-colors"
          >
            <LogIn size={16} /> Sign in
          </Link>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {data.items.map((item: ItemRow) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-cream-dark p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border border-cream-dark"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-cream-dark" />
                )}
                <div>
                  <h2 className="font-semibold text-ink">{item.name}</h2>
                  <p className="text-xs text-ink-soft">
                    {item.files.length} file{item.files.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {item.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      className="flex items-center justify-between gap-3 bg-cream rounded-xl px-4 py-3 hover:bg-cream-dark transition-colors group"
                      download
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <FileText size={17} className="text-berry flex-shrink-0" />
                        <span className="text-sm text-ink truncate">
                          {file.fileName}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-berry flex-shrink-0 flex items-center gap-1 group-hover:underline">
                        <Download size={14} />
                        Download {formatSize(file.sizeBytes)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink-soft text-center pt-2">
            Links refresh automatically each time you open this page. Need help?{" "}
            <Link href="/contact" className="text-berry font-semibold hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
