"use client";

import { useEffect, useState } from "react";
import { Search, X, Users, Shield, User, Mail, Phone, Calendar, Trash2, Plus, UserPlus } from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) =>
    search === "" ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const updateRole = async (id: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    fetchUsers();
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete ${name || "this user"}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      fetchUsers();
    } else {
      alert(data.error || "Failed to delete user");
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        return;
      }
      setCreateSuccess(`User ${createForm.email} created`);
      setCreateForm({ name: "", email: "", phone: "", password: "" });
      fetchUsers();
      setTimeout(() => setShowCreate(false), 1200);
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500 text-sm">Loading customers...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setCreateError(""); setCreateSuccess(""); }}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserPlus size={18} />
            New Customer Account
          </h2>
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg mb-4 text-sm">
              {createError}
            </div>
          )}
          {createSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg mb-4 text-sm">
              {createSuccess}
            </div>
          )}
          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                placeholder="Customer name"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                placeholder="customer@example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                required
                placeholder="9876543210"
                maxLength={10}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={creating || !createForm.name || !createForm.email || !createForm.phone || !createForm.password}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Customer"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No customers found
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.role === "ADMIN" ? (
                          <Shield size={16} className="text-purple-600" />
                        ) : (
                          <User size={16} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{user.firstName || user.name || "Unnamed"}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "ADMIN" ? <Shield size={10} /> : <User size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium">{user._count.orders}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user.id, user.firstName || user.name || user.email)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete customer"
                      >
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            No customers found
          </div>
        )}
        {filtered.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.role === "ADMIN" ? (
                    <Shield size={16} className="text-purple-600" />
                  ) : (
                    <User size={16} className="text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{user.firstName || user.name || "Unnamed"}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => deleteUser(user.id, user.firstName || user.name || user.email)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <span className="text-xs text-gray-400">{user._count.orders} orders</span>
              </div>
              <span className="text-[11px] text-gray-400">
                {new Date(user.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
