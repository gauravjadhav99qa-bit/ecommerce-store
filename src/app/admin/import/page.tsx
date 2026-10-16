"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Package,
} from "lucide-react";

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const FILE_TYPES = ["application/pdf", "application/zip"];
const MAX_COVER = 4 * 1024 * 1024;
const MAX_FILE = 50 * 1024 * 1024;

type Status = "pending" | "importing" | "done" | "error";

interface Item {
  id: string; // client uuid
  stem: string; // filename stem used for pairing + default name
  name: string;
  price: string;
  cover?: File;
  file?: File;
  status: Status;
  error?: string;
  productId?: string;
}

interface Category {
  id: string;
  name: string;
}

const stemOf = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const titleCase = (s: string) =>
  s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function AdminImportPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("49");
  const [defaultDesc, setDefaultDesc] = useState(
    "High-resolution printable PDF. Instant digital download; no physical item is shipped."
  );
  const [isActive, setIsActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [fileError, setFileError] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          const mandala = data.find((c: Category) =>
            /mandala/i.test(c.name)
          );
          if (mandala) setCategoryId(mandala.id);
        }
      })
      .catch(() => {});
  }, []);

  // Merge incoming files into the item list, pairing by stem.
  const addFiles = useCallback(
    (covers: File[], files: File[]) => {
      setCoverError("");
      setFileError("");
      setItems((prev) => {
        const next = [...prev];
        const byStem = new Map<string, number>();
        next.forEach((it, i) => byStem.set(it.stem, i));

        const push = (f: File, kind: "cover" | "file") => {
          const stem = stemOf(f.name);
          let idx = byStem.get(stem);
          if (idx === undefined) {
            next.push({
              id: newId(),
              stem,
              name: titleCase(stem),
              price: defaultPrice,
              status: "pending",
              [kind]: f,
            } as Item);
            idx = next.length - 1;
            byStem.set(stem, idx);
          } else {
            next[idx] = { ...next[idx], [kind]: f } as Item;
          }
        };

        covers.forEach((f) => {
          if (!COVER_TYPES.includes(f.type)) {
            setCoverError((e) => e || `Skipped non-image: ${f.name}`);
            return;
          }
          if (f.size > MAX_COVER) {
            setCoverError((e) => e || `Too large (max 4MB): ${f.name}`);
            return;
          }
          push(f, "cover");
        });
        files.forEach((f) => {
          if (!FILE_TYPES.includes(f.type)) {
            setFileError((e) => e || `Skipped non-PDF/ZIP: ${f.name}`);
            return;
          }
          if (f.size > MAX_FILE) {
            setFileError((e) => e || `Too large (max 50MB): ${f.name}`);
            return;
          }
          push(f, "file");
        });
        return next;
      });
    },
    [defaultPrice]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>, kind: "cover" | "file") => {
    const list = Array.from(e.target.files || []);
    if (kind === "cover") addFiles(list, []);
    else addFiles([], list);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const list = Array.from(e.dataTransfer.files || []);
    const covers = list.filter((f) => COVER_TYPES.includes(f.type));
    const files = list.filter((f) => FILE_TYPES.includes(f.type));
    const skipped = list.length - covers.length - files.length;
    if (skipped > 0) setCoverError(`Skipped ${skipped} unsupported file(s).`);
    addFiles(covers, files);
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const clearAll = () => setItems([]);

  const total = items.length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const readyCount = items.filter((i) => i.cover || i.file).length;

  const runImport = async () => {
    if (importing || items.length === 0) return;
    setImporting(true);
    try {
      for (const item of items) {
        if (item.status === "done") continue;
        if (!item.cover && !item.file) continue;
        updateItem(item.id, { status: "importing", error: undefined });
        try {
          const price = parseFloat(item.price || defaultPrice) || 0;
          const payload = {
            name: item.name || titleCase(item.stem),
            description: defaultDesc || null,
            price,
            isActive,
            featured,
            isDigital: true,
            productType: "SINGLE",
            stock: 9999,
            categoryId: categoryId || null,
            fileFormat: item.file ? "PDF" : null,
            tags: JSON.stringify(["printable", "digital download"]),
          };
          const res = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Create failed");
          }
          const product = await res.json();
          updateItem(item.id, { productId: product.id });

          if (item.cover) {
            const fd = new FormData();
            fd.append("image", item.cover);
            const cRes = await fetch(`/api/admin/products/${product.id}/cover`, {
              method: "POST",
              body: fd,
            });
            if (!cRes.ok) throw new Error("Cover upload failed");
          }

          if (item.file) {
            const url = `/api/admin/products/${product.id}/files`;
            const initRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: "init",
                fileName: item.file.name,
                mimeType: item.file.type,
                sizeBytes: item.file.size,
              }),
            });
            const init = await initRes.json().catch(() => ({}));
            if (!initRes.ok) throw new Error(init.error || "File upload failed");

            if (init.mode === "direct" && init.token) {
              const { put } = await import("@vercel/blob/client");
              const blob = await put(init.pathname, item.file, {
                access: "private",
                token: init.token,
                contentType: item.file.type,
              });
              const commitRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mode: "commit",
                  storagePath: blob.pathname,
                  fileName: item.file.name,
                  mimeType: item.file.type,
                  sizeBytes: item.file.size,
                }),
              });
              if (!commitRes.ok) {
                const data = await commitRes.json().catch(() => ({}));
                throw new Error(data.error || "File commit failed");
              }
            } else {
              const fd = new FormData();
              fd.append("file", item.file);
              const fRes = await fetch(url, { method: "POST", body: fd });
              if (!fRes.ok) throw new Error("File upload failed");
            }
          }

          updateItem(item.id, { status: "done" });
        } catch (err) {
          updateItem(item.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Import failed",
          });
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const statusIcon = (it: Item) => {
    if (it.status === "importing")
      return <Loader2 size={16} className="text-blue-500 animate-spin" />;
    if (it.status === "done")
      return <CheckCircle2 size={16} className="text-green-600" />;
    if (it.status === "error")
      return <XCircle size={16} className="text-red-500" />;
    return <Package size={16} className="text-gray-400" />;
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 min-h-[44px] flex items-center"
          aria-label="Back to products"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bulk Import</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drop cover images and PDFs. Files with the same name are paired into one product.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => coverInput.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <UploadCloud size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          Drag &amp; drop covers (PNG/JPEG/WebP) and PDFs here
        </p>
        <p className="text-xs text-gray-500 mt-1">
          or click to browse. <code>lotus.png</code> + <code>lotus.pdf</code> become one product.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              coverInput.current?.click();
            }}
            className="flex items-center gap-2 text-xs border border-gray-300 rounded-lg px-3 py-2 hover:bg-white"
          >
            <ImageIcon size={14} /> Choose images
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInput.current?.click();
            }}
            className="flex items-center gap-2 text-xs border border-gray-300 rounded-lg px-3 py-2 hover:bg-white"
          >
            <FileText size={14} /> Choose PDFs
          </button>
        </div>
        <input
          ref={coverInput}
          type="file"
          accept={COVER_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => onPick(e, "cover")}
        />
        <input
          ref={fileInput}
          type="file"
          accept={FILE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => onPick(e, "file")}
        />
      </div>
      {(coverError || fileError) && (
        <p className="text-xs text-red-600 mt-2">{coverError || fileError}</p>
      )}

      {/* Defaults */}
      {items.length > 0 && (
        <div className="mt-6 border border-gray-200 rounded-xl p-4 bg-white">
          <h2 className="text-sm font-semibold mb-3">Defaults for all products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-500">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Price (₹)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block mt-3">
            <span className="text-xs text-gray-500">Description</span>
            <textarea
              value={defaultDesc}
              onChange={(e) => setDefaultDesc(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-center gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured
            </label>
          </div>
        </div>
      )}

      {/* Item list */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              {readyCount} of {total} ready
              {doneCount > 0 && ` · ${doneCount} imported`}
              {errorCount > 0 && ` · ${errorCount} failed`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                disabled={importing}
                className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                onClick={runImport}
                disabled={importing || readyCount === 0}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 min-h-[40px]"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Importing…
                  </>
                ) : (
                  <>Import {readyCount} product{readyCount !== 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
            {items.map((it) => (
              <li key={it.id} className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-6 flex justify-center">{statusIcon(it)}</div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                      className="w-full text-sm font-medium border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 -ml-2"
                      placeholder="Product name"
                    />
                    <div className="flex items-center gap-3 px-2 text-xs text-gray-500">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          it.cover ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        <ImageIcon size={12} /> {it.cover ? "cover" : "no cover"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          it.file ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        <FileText size={12} /> {it.file ? "pdf" : "no pdf"}
                      </span>
                      {it.status === "error" && it.error && (
                        <span className="text-red-600 truncate">{it.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={it.price}
                        onChange={(e) => updateItem(it.id, { price: e.target.value })}
                        className="w-16 text-sm border border-gray-200 rounded px-2 py-1"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      disabled={importing}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {doneCount > 0 && !importing && (
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/admin/products"
                className="text-sm text-gray-700 underline hover:text-gray-900"
              >
                View all products
              </Link>
              <Link
                href="/admin/import"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                Import another batch
              </Link>
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 mt-6">
          Nothing selected yet. Everything is imported one product at a time so large batches
          never hit request-size limits.
        </p>
      )}
    </div>
  );
}
