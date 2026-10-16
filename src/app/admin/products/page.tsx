"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Eye,
  EyeOff,
  ImagePlus,
  FileText,
  Upload,
  Download,
  Star,
} from "lucide-react";
import { parseImages } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}
interface ProductFile {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
}
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  sku: string | null;
  isActive: boolean;
  featured: boolean;
  images: string;
  categoryId: string | null;
  isDigital: boolean;
  productType: "SINGLE" | "BUNDLE";
  pageCount: number | null;
  paperSize: string | null;
  fileFormat: string | null;
  printInstructions: string | null;
  license: string | null;
  tags: string;
  category?: { name: string } | null;
  files?: ProductFile[];
  bundleItems?: { product: { id: string; name: string } }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState("");
  // Prevent background scroll while the add/edit modal is open (mobile).
  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAt: "",
    stock: "9999",
    sku: "",
    categoryId: "",
    featured: false,
    isActive: true,
    productType: "SINGLE" as "SINGLE" | "BUNDLE",
    pageCount: "",
    paperSize: "A4 & US Letter",
    fileFormat: "PDF",
    printInstructions: "",
    license: "",
    bundleItemIds: [] as string[],
  });

  const reload = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (Array.isArray(data)) setProducts(data);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter(
    (p) =>
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const addImage = () => {
    const url = newImageUrl.trim();
    if (url && !formImages.includes(url)) {
      setFormImages([...formImages, url]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formImages.length) return;
    const updated = [...formImages];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormImages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...(editingProduct && { id: editingProduct.id }),
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      compareAt: form.compareAt ? parseFloat(form.compareAt) : null,
      stock: parseInt(form.stock) || 0,
      sku: form.sku || null,
      categoryId: form.categoryId || null,
      featured: form.featured,
      isActive: form.isActive,
      isDigital: true,
      productType: form.productType,
      pageCount: form.pageCount ? parseInt(form.pageCount) : null,
      paperSize: form.paperSize || null,
      fileFormat: form.fileFormat || "PDF",
      printInstructions: form.printInstructions || null,
      license: form.license || null,
      images: JSON.stringify(formImages),
      ...(form.productType === "BUNDLE" ? { bundleItemIds: form.bundleItemIds } : {}),
    };
    const res = await fetch("/api/admin/products", {
      method: editingProduct ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const saved = await res.json().catch(() => null);
      setShowModal(false);
      await reload();
      // After create, open edit so admin can immediately upload PDFs / covers.
      if (!editingProduct && saved?.id) {
        setEditingProduct({
          ...saved,
          files: saved.files || [],
          bundleItems: saved.bundleItems || [],
        });
        setFormImages(parseImages(saved.images || "[]"));
        setShowModal(true);
      } else {
        setEditingProduct(null);
        resetForm();
      }
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (data.message) alert(data.message);
    await reload();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormImages(parseImages(product.images));
    setForm({
      name: product.name,
      description: product.description || "",
      price: (product.price / 100).toString(),
      compareAt: product.compareAt ? (product.compareAt / 100).toString() : "",
      stock: product.stock.toString(),
      sku: product.sku || "",
      categoryId: product.categoryId || "",
      featured: product.featured,
      isActive: product.isActive,
      productType: product.productType || "SINGLE",
      pageCount: product.pageCount?.toString() || "",
      paperSize: product.paperSize || "",
      fileFormat: product.fileFormat || "PDF",
      printInstructions: product.printInstructions || "",
      license: product.license || "",
      bundleItemIds:
        product.bundleItems?.map((bi) => bi.product.id) || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      compareAt: "",
      stock: "9999",
      sku: "",
      categoryId: "",
      featured: false,
      isActive: true,
      productType: "SINGLE",
      pageCount: "",
      paperSize: "A4 & US Letter",
      fileFormat: "PDF",
      printInstructions: "",
      license: "",
      bundleItemIds: [],
    });
    setFormImages([]);
    setNewImageUrl("");
    setUploadError("");
    setCoverError("");
  };

  const toggleActive = async (product: Product) => {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update status");
    }
    await reload();
  };

  const toggleFeatured = async (product: Product) => {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, featured: !product.featured }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update featured");
    }
    await reload();
  };

  const uploadFile = async (file: File) => {
    if (!editingProduct) return;
    // Client-side validation so users get a clear message, not a generic error.
    if (!["application/pdf", "application/zip"].includes(file.type)) {
      setUploadError("Only PDF and ZIP files are allowed");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File too large (max 50MB)");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const url = `/api/admin/products/${editingProduct.id}/files`;
      // Ask the server how this file should be uploaded.
      const initRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "init",
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const init = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        setUploadError(init.error || "Upload failed");
        return;
      }

      if (init.mode === "direct" && init.token) {
        // Large-file path: upload straight to Blob with the server-issued
        // client token, bypassing the serverless request-body limit, then
        // commit the record. (Client `put` accepts a token; client `upload`
        // only works against a handleUploadUrl route.)
        const { put } = await import("@vercel/blob/client");
        const blob = await put(init.pathname, file, {
          access: "private",
          token: init.token,
          contentType: file.type,
        });
        const commitRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "commit",
            storagePath: blob.pathname,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        if (!commitRes.ok) {
          const data = await commitRes.json().catch(() => ({}));
          setUploadError(data.error || "Upload failed");
          return;
        }
      } else {
        // Small-file / local path: upload through the route.
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(url, { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUploadError(data.error || "Upload failed");
          return;
        }
      }
      await reload();
    } catch (err) {
      console.error("File upload error:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!editingProduct) return;
    if (!confirm("Remove this file?")) return;
    await fetch(`/api/admin/products/${editingProduct.id}/files?fileId=${fileId}`, {
      method: "DELETE",
    });
    await reload();
  };

  const uploadCover = async (file: File) => {
    if (!editingProduct) return;
    // Client-side validation so users get a clear message, not a generic error.
    if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      setCoverError("Only JPEG, PNG, WebP or SVG images are allowed");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setCoverError("Image too large (max 4MB)");
      return;
    }
    setUploadingCover(true);
    setCoverError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/admin/products/${editingProduct.id}/cover`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCoverError(data.error || "Cover upload failed");
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.url) setFormImages((prev) => (prev.includes(data.url) ? prev : [...prev, data.url]));
        await reload();
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      setCoverError("Cover upload failed. Please try again.");
    } finally {
      setUploadingCover(false);
    }
  };

  const liveFiles =
    editingProduct?.id
      ? products.find((p) => p.id === editingProduct.id)?.files || []
      : [];

  const singleProducts = products.filter(
    (p) => p.isDigital && p.productType === "SINGLE" && p.id !== editingProduct?.id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gray-900 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-gray-700 text-sm min-h-[44px]"
        >
          <Plus size={16} />{" "}
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Files</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400 text-sm"
                  >
                    No products found
                  </td>
                </tr>
              )}
              {filtered.map((product) => {
                const images = parseImages(product.images);
                const fileCount = product.files?.length || 0;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {product.name}
                            {product.productType === "BUNDLE" && (
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                BUNDLE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.sku || "No SKU"}
                            {product.pageCount ? ` · ${product.pageCount} pp` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        ₹{(product.price / 100).toLocaleString("en-IN")}
                      </div>
                      {product.compareAt && (
                        <div className="text-xs text-gray-400 line-through">
                          ₹{(product.compareAt / 100).toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          fileCount > 0 ? "text-green-600" : "text-orange-500"
                        }`}
                      >
                        <FileText size={12} />
                        {fileCount > 0 ? `${fileCount} file(s)` : "No files"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          product.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {product.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        {product.isActive ? "Active" : "Draft"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`p-2 rounded-lg ${
                            product.featured
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-gray-300 hover:bg-gray-100 hover:text-amber-400"
                          }`}
                          title={product.featured ? "Unfeature" : "Feature on home"}
                        >
                          <Star size={14} fill={product.featured ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No products found
          </div>
        )}
        {filtered.map((product) => {
          const images = parseImages(product.images);
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {images[0] ? (
                    <img
                      src={images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.category?.name || "No category"} ·{" "}
                    {product.files?.length || 0} file(s)
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold">
                      ₹{(product.price / 100).toLocaleString("en-IN")}
                    </span>
                    {product.compareAt && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{(product.compareAt / 100).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(product)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${
                    product.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {product.isActive ? <Eye size={10} /> : <EyeOff size={10} />}
                  {product.isActive ? "Active" : "Draft"}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={`p-2 rounded-lg ${
                      product.featured
                        ? "text-amber-500"
                        : "text-gray-300"
                    }`}
                  >
                    <Star size={14} fill={product.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] p-2 sm:p-4 overflow-y-auto flex justify-center items-start sm:items-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90dvh] my-auto overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product type
                  </label>
                  <select
                    value={form.productType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        productType: e.target.value as "SINGLE" | "BUNDLE",
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="SINGLE">Single product</option>
                    <option value="BUNDLE">Bundle (collection)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare at (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.compareAt}
                    onChange={(e) =>
                      setForm({ ...form, compareAt: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pages
                  </label>
                  <input
                    type="number"
                    value={form.pageCount}
                    onChange={(e) =>
                      setForm({ ...form, pageCount: e.target.value })
                    }
                    placeholder="30"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paper size
                  </label>
                  <input
                    type="text"
                    value={form.paperSize}
                    onChange={(e) =>
                      setForm({ ...form, paperSize: e.target.value })
                    }
                    placeholder="A4 & US Letter"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <input
                    type="text"
                    value={form.fileFormat}
                    onChange={(e) =>
                      setForm({ ...form, fileFormat: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (optional)
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print instructions (shown on product page)
                </label>
                <textarea
                  value={form.printInstructions}
                  onChange={(e) =>
                    setForm({ ...form, printInstructions: e.target.value })
                  }
                  rows={2}
                  placeholder="Print at 100% scale on A4 or US Letter..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Licence / permitted use
                </label>
                <textarea
                  value={form.license}
                  onChange={(e) =>
                    setForm({ ...form, license: e.target.value })
                  }
                  rows={2}
                  placeholder="Personal use only. Print unlimited copies..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                />
              </div>

              {/* Bundle selector */}
              {form.productType === "BUNDLE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Products included in this bundle
                  </label>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {singleProducts.length === 0 && (
                      <p className="text-xs text-gray-400 p-3">
                        Create single products first, then bundle them here.
                      </p>
                    )}
                    {singleProducts.map((p) => {
                      const checked = form.bundleItemIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                bundleItemIds: e.target.checked
                                  ? [...form.bundleItemIds, p.id]
                                  : form.bundleItemIds.filter(
                                      (id) => id !== p.id
                                    ),
                              });
                            }}
                            className="rounded w-4 h-4"
                          />
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            ₹{(p.price / 100).toFixed(0)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.bundleItemIds.length} product(s) selected. Bundle
                    buyers download every selected product&apos;s files.
                  </p>
                </div>
              )}

              {/* Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Download size={14} /> Downloadable files
                  </span>
                </label>
                {!editingProduct && (
                  <p className="text-xs text-gray-400 mb-2">
                    Save the product first, then edit it to upload PDF files.
                  </p>
                )}
                {editingProduct && (
                  <>
                    {liveFiles.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {liveFiles.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText size={14} className="text-gray-400" />
                              <span className="truncate">{file.fileName}</span>
                              <span className="text-xs text-gray-400">
                                {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteFile(file.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-4 cursor-pointer hover:border-gray-500 text-sm text-gray-600">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Upload PDF or ZIP"}
                      <input
                        type="file"
                        accept=".pdf,.zip,application/pdf,application/zip"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadFile(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {uploadError && (
                      <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Multi-Photo Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <ImagePlus size={14} /> Cover images ({formImages.length})
                  </span>
                </label>
                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {formImages.map((url, i) => (
                      <div
                        key={i}
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            PRIMARY
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(i, -1)}
                              className="p-1 bg-white/90 rounded text-xs font-medium"
                            >
                              ←
                            </button>
                          )}
                          {i < formImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(i, 1)}
                              className="p-1 bg-white/90 rounded text-xs font-medium"
                            >
                              →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="p-1 bg-red-500 text-white rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                    placeholder="Paste image URL and press Add"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
                {editingProduct && (
                  <label className="mt-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-gray-500 text-sm text-gray-600">
                    <Upload size={16} />
                    {uploadingCover ? "Uploading cover..." : "Upload cover image (JPEG/PNG/WebP/SVG, max 4MB)"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingCover}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {coverError && (
                  <p className="text-xs text-red-500 mt-1">{coverError}</p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                    className="rounded w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="rounded w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
