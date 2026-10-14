"use client";

import { useEffect, useState } from "react";
import { Package, ChevronDown, ChevronUp, X, Clock, CheckCircle, Trash2, ChevronRight, Download, CreditCard, RotateCcw } from "lucide-react";
import { parseImages } from "@/lib/utils";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  productId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    icon: <Clock size={14} />,
  },
  PAID: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <CreditCard size={14} />,
  },
  COMPLETED: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle size={14} />,
  },
  FAILED: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <X size={14} />,
  },
  REFUNDED: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    icon: <RotateCcw size={14} />,
  },
  CANCELLED: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: <X size={14} />,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const cancelOrder = async (orderNumber: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrder(orderNumber);
    await fetch(`/api/orders/${orderNumber}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    await fetchOrders();
    setCancellingOrder(null);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Package size={32} className="text-gray-400 sm:hidden" />
          <Package size={40} className="text-gray-400 hidden sm:block" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          When you buy a colouring book or planner, your download links appear here instantly.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
        <Link href="/account" className="hover:text-gray-900">My Account</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">My Orders</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
          const isExpanded = expandedOrder === order.id;
          const canCancel = order.status === "PENDING";
          const canDownload = order.status === "PAID" || order.status === "COMPLETED";

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-sm sm:text-base text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {statusConfig.icon}
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {" \u2022 "}
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-bold text-base sm:text-lg text-gray-900">
                      ₹{(order.total / 100).toFixed(0)}
                    </span>
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOrder(order.orderNumber);
                          }}
                          disabled={cancellingOrder === order.orderNumber}
                          className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Cancel Order"
                        >
                          {cancellingOrder === order.orderNumber ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const imageUrl = item.image
                        ? item.image.startsWith("[")
                          ? parseImages(item.image)[0]
                          : item.image
                        : null;

                      return (
                        <div
                          key={item.id}
                          className="flex gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Digital download
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              ₹{((item.price * item.quantity) / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    {canDownload && (
                      <Link
                        href={`/download/${order.orderNumber}`}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        <Download size={14} />
                        My Downloads
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => cancelOrder(order.orderNumber)}
                        disabled={cancellingOrder === order.orderNumber}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {cancellingOrder === order.orderNumber ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            Cancel Order
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
