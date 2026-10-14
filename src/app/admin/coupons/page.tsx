"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tag, Check, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "flat",
    value: "",
    minOrder: "",
    maxUses: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((data) => {
        setCoupons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...(editingCoupon && { id: editingCoupon.id }),
      code: form.code,
      discountType: form.discountType,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      maxUses: Number(form.maxUses) || 100,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: form.isActive,
    };

    const method = editingCoupon ? "PUT" : "POST";
    await fetch("/api/admin/coupons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.discountType === "flat" ? (coupon.value / 100).toString() : coupon.value.toString(),
      minOrder: coupon.minOrder ? (coupon.minOrder / 100).toString() : "",
      maxUses: coupon.maxUses.toString(),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      code: "",
      discountType: "percentage",
      value: "",
      minOrder: "",
      maxUses: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading coupons...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Coupons</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 text-xs sm:text-sm min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Coupon</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-left text-xs sm:text-sm text-gray-500 border-b border-gray-200">
                <th className="p-3 sm:p-4">Code</th>
                <th className="p-3 sm:p-4">Discount</th>
                <th className="p-3 sm:p-4 hidden sm:table-cell">Min Order</th>
                <th className="p-3 sm:p-4 hidden md:table-cell">Uses</th>
                <th className="p-3 sm:p-4 hidden sm:table-cell">Expires</th>
                <th className="p-3 sm:p-4">Status</th>
                <th className="p-3 sm:p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-gray-100">
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-mono font-semibold text-xs sm:text-sm">{coupon.code}</span>
                      <button
                        onClick={() => copyCode(coupon.code, coupon.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedId === coupon.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm">
                    {coupon.discountType === "percentage"
                      ? `${coupon.value}%`
                      : `₹${(coupon.value / 100).toFixed(0)}`}
                  </td>
                  <td className="p-3 sm:p-4 text-gray-500 text-xs sm:text-sm hidden sm:table-cell">
                    {coupon.minOrder > 0 ? `₹${(coupon.minOrder / 100).toFixed(0)}` : "—"}
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm hidden md:table-cell">
                    {coupon.usedCount}/{coupon.maxUses}
                  </td>
                  <td className="p-3 sm:p-4 text-gray-500 text-xs sm:text-sm hidden sm:table-cell">
                    {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${
                      coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button onClick={() => handleEdit(coupon)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-50 text-red-500 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
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
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-mono font-semibold text-sm truncate">{coupon.code}</span>
                  <button onClick={() => copyCode(coupon.code, coupon.id)} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center -my-2">
                    {copiedId === coupon.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {coupon.discountType === "percentage" ? `${coupon.value}% off` : `₹${(coupon.value / 100).toFixed(0)} off`}
                  {" · "}Min {coupon.minOrder > 0 ? `₹${(coupon.minOrder / 100).toFixed(0)}` : "—"}
                  {" · "}{coupon.usedCount}/{coupon.maxUses} uses
                </div>
                <div className="mt-0.5 text-[11px] text-gray-400">
                  Expires {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] rounded-full flex-shrink-0 ${
                coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {coupon.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
              <button onClick={() => handleEdit(coupon)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-50 text-red-500 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold">
                {editingCoupon ? "Edit Coupon" : "Add Coupon"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE10"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "flat" })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base"
                  >
                    <option value="percentage">% Off</option>
                    <option value="flat">Flat ₹ Off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Value {form.discountType === "percentage" ? "(%)" : "(₹)"} *
                  </label>
                  <input
                    type="number"
                    step={form.discountType === "flat" ? "0.01" : "1"}
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[44px] text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-xs sm:text-sm">Active</span>
                </label>
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 min-h-[44px] text-sm sm:text-base">
                {editingCoupon ? "Update Coupon" : "Add Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
