"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X, Calendar, Trash2, Save } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string | null;
  shippingAddr: string | null;
  createdAt: string;
  user: { name: string | null; email: string; phone: string | null } | null;
  items: OrderItem[];
}

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editForm, setEditForm] = useState({ shippingName: "", shippingEmail: "", shippingPhone: "", shippingAddr: "" });
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      setEditForm({
        shippingName: selectedOrder.shippingName || "",
        shippingEmail: selectedOrder.shippingEmail || "",
        shippingPhone: selectedOrder.shippingPhone || "",
        shippingAddr: "",
      });
    }
  }, [selectedOrder]);

  const filtered = orders.filter((o) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.shippingName?.toLowerCase().includes(q)
    );
  });

  const saveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);

    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedOrder.id,
        shippingName: editForm.shippingName,
        shippingEmail: editForm.shippingEmail,
        shippingPhone: editForm.shippingPhone,
      }),
    });
    await fetchOrders();
    setSelectedOrder((prev) => prev ? {
      ...prev,
      shippingName: editForm.shippingName,
      shippingEmail: editForm.shippingEmail,
      shippingPhone: editForm.shippingPhone,
    } : null);
    setSaving(false);
  };

  const deleteOrder = async (id: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/orders?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete order");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("ALL");
  };

  const shipping = selectedOrder?.shippingAddr ? (() => { try { return JSON.parse(selectedOrder.shippingAddr); } catch { return null; } })() : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Date Range + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Calendar size={16} className="text-gray-400 flex-shrink-0" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm border-0 focus:outline-none focus:ring-0 w-full sm:w-auto" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm border-0 focus:outline-none focus:ring-0 w-full sm:w-auto" />
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        {(dateFrom || dateTo || search) && (
          <button onClick={clearFilters} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap">Clear filters</button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3 hidden lg:table-cell">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No orders found</td></tr>
              )}
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="px-6 py-4 font-medium text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{order.user?.name || order.shippingName || "Guest"}</div>
                    <div className="text-xs text-gray-500">{order.user?.email || order.shippingEmail}</div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">₹{(order.total / 100).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs font-medium rounded-full px-3 py-1.5 inline-block ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => deleteOrder(order.id, order.orderNumber)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete order"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">No orders found</div>
        )}
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setSelectedOrder(order)}>
              <div>
                <div className="text-sm font-semibold">{order.orderNumber}</div>
                <div className="text-xs text-gray-500">{order.user?.name || order.shippingName || "Guest"}</div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">₹{(order.total / 100).toLocaleString("en-IN")}</div>
                <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <span className={`text-xs font-medium rounded-full px-3 py-1.5 ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                {order.status}
              </span>
              <button
                onClick={() => deleteOrder(order.id, order.orderNumber)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete order"
                >
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status (read-only — set automatically by payment) */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                <div className="mt-2">
                  <span className={`text-sm font-medium rounded-lg px-4 py-2 inline-block ${STATUS_COLORS[selectedOrder.status] || "bg-gray-100 text-gray-600"}`}>
                    {selectedOrder.status}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Status is set automatically from payment (Razorpay verify/webhook).
                  </p>
                </div>
              </div>

              {/* Customer contact (delivery = email for digital) */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Customer contact</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input type="text" value={editForm.shippingName} onChange={(e) => setEditForm({ ...editForm, shippingName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email (download links are sent here)</label>
                    <input type="email" value={editForm.shippingEmail} onChange={(e) => setEditForm({ ...editForm, shippingEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input type="text" value={editForm.shippingPhone} onChange={(e) => setEditForm({ ...editForm, shippingPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <button
                    onClick={saveOrder}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Items ({selectedOrder.items.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-medium">₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Customer</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <div className="text-sm">{selectedOrder.user?.name || selectedOrder.shippingName}</div>
                  <div className="text-sm text-gray-600">{selectedOrder.user?.email || selectedOrder.shippingEmail}</div>
                  {(selectedOrder.user?.phone || selectedOrder.shippingPhone) && (
                    <div className="text-sm text-gray-600">{selectedOrder.user?.phone || selectedOrder.shippingPhone}</div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Payment Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{((selectedOrder.total - (shipping?.discount || 0)) / 100).toLocaleString("en-IN")}</span>
                  </div>
                  {shipping?.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({shipping.couponCode})</span>
                      <span>-₹{(shipping.discount / 100).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{(selectedOrder.total / 100).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
