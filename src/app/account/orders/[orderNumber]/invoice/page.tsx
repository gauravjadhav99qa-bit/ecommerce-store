"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string | null;
}

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCost: number;
  total: number;
  billing: {
    name: string;
    email: string;
    phone: string | null;
  };
  status: string;
}

export default function InvoicePage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders/${orderNumber}/invoice`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load invoice");
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || "Invoice not found"}</p>
          <Link
            href="/account/orders"
            className="text-sm text-gray-900 underline hover:no-underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print, .invoice-print * { visibility: visible; }
          .invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 no-print">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="invoice-print bg-white border border-gray-200 rounded-lg p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">GT Shopping</h1>
            <p className="text-sm text-gray-500 mt-1">Print. Colour. Create.</p>
            <p className="text-xs text-gray-400 mt-0.5">gtshoppingonline.in</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order #:</span> {invoice.orderNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Date:</span>{" "}
              {new Date(invoice.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span>{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {invoice.status}
              </span>
            </p>
          </div>
        </div>

        {/* Billing & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Billed To
            </h3>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-medium text-gray-900">{invoice.billing.name}</p>
              <p>{invoice.billing.email}</p>
              {invoice.billing.phone && <p>{invoice.billing.phone}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Delivery
            </h3>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-medium text-gray-900">Digital download (PDF)</p>
              <p>Links emailed to {invoice.billing.email}</p>
              <p>Re-download anytime from your account</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 sm:mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-900">Item</th>
                <th className="text-center py-3 font-semibold text-gray-900 w-16">Qty</th>
                <th className="text-right py-3 font-semibold text-gray-900 w-24">Unit Price</th>
                <th className="text-right py-3 font-semibold text-gray-900 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{item.name}</td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">
                    ₹{(item.unitPrice / 100).toFixed(0)}
                  </td>
                  <td className="py-3 text-right text-gray-900 font-medium">
                    ₹{(item.total / 100).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8 sm:mb-10">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">₹{(invoice.subtotal / 100).toFixed(0)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount {invoice.couponCode ? `(${invoice.couponCode})` : ""}</span>
                <span>-₹{(invoice.discount / 100).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span className="text-green-600 font-medium">Instant download</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (GST)</span>
              <span className="text-gray-600">Included</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">₹{(invoice.total / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8 sm:mb-10">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Payment Method:</span> Razorpay (UPI / Cards / Netbanking)
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100">
          <p>Thank you for buying from GT Shopping!</p>
          <p className="mt-1">For queries, contact us at hello@gtshoppingonline.in</p>
        </div>
      </div>
    </div>
  );
}
