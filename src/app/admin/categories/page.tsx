"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // Prevent background scroll while the modal is open (mobile).
  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);
  const [form, setForm] = useState({ name: "", image: "" });

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategory ? "PUT" : "POST";
    const payload = editingCategory
      ? { id: editingCategory.id, name: form.name, image: form.image || null }
      : { name: form.name, image: form.image || null };

    await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    setEditingCategory(null);
    setForm({ name: "", image: "" });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, image: category.image || "" });
    setShowModal(true);
  };

  const openModal = () => {
    setEditingCategory(null);
    setForm({ name: "", image: "" });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading categories...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Categories</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 sm:gap-2 bg-gray-900 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg hover:bg-gray-700 text-xs sm:text-sm min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Category</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">No categories yet. Add one to get started.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-xs sm:text-sm text-gray-500 border-b border-gray-200">
                    <th className="p-3 sm:p-4">Name</th>
                    <th className="p-3 sm:p-4 hidden sm:table-cell">Slug</th>
                    <th className="p-3 sm:p-4">Products</th>
                    <th className="p-3 sm:p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {category.image ? (
                              <img src={category.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FolderOpen size={16} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-xs sm:text-sm">{category.name}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-gray-500 text-xs sm:text-sm hidden sm:table-cell">
                        {category.slug}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">{category._count.products}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button onClick={() => handleEdit(category)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-red-50 text-red-500 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {category.image ? (
                      <img src={category.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FolderOpen size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{category.name}</div>
                    <div className="text-xs text-gray-500">{category._count.products} products · {category.slug}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(category)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-red-50 text-red-500 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] p-2 sm:p-4 overflow-y-auto flex justify-center items-start sm:items-center">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90dvh] my-auto overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 min-h-[44px] text-sm sm:text-base">
                {editingCategory ? "Update Category" : "Add Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
