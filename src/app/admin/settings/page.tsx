"use client";

import { useEffect, useState } from "react";
import { Save, Store, Mail, Megaphone, Phone, MessageCircle, FileText } from "lucide-react";

interface Settings {
  siteName: string;
  contactEmail: string;
  announcement: string;
  supportPhone: string;
  whatsapp: string;
  footerNote: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load settings");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setSettings(await res.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Settings, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return <div className="text-red-600 text-sm">{error || "Failed to load"}</div>;
  }

  const fields: {
    key: keyof Settings;
    label: string;
    icon: React.ElementType;
    placeholder?: string;
    help?: string;
    multiline?: boolean;
    type?: string;
  }[] = [
    {
      key: "siteName",
      label: "Store name",
      icon: Store,
      placeholder: "GT Shopping",
      help: "Shown in the header logo area, footer, emails and invoices.",
    },
    {
      key: "contactEmail",
      label: "Contact email",
      icon: Mail,
      type: "email",
      placeholder: "hello@gtshoppingonline.in",
      help: "Shown on contact, FAQ, policy pages and invoices.",
    },
    {
      key: "announcement",
      label: "Announcement bar",
      icon: Megaphone,
      multiline: true,
      placeholder: "Instant PDF downloads — print at home today.",
      help: "Short text strip at the very top of every page.",
    },
    {
      key: "footerNote",
      label: "Footer tagline",
      icon: FileText,
      placeholder: "Digital printables · Instant download",
      help: "One-line note under the footer logo.",
    },
    {
      key: "supportPhone",
      label: "Support phone (optional)",
      icon: Phone,
      placeholder: "+91 98765 43210",
      help: "Leave blank to hide.",
    },
    {
      key: "whatsapp",
      label: "WhatsApp number (optional)",
      icon: MessageCircle,
      placeholder: "919876543210",
      help: "Digits only with country code, e.g. 919876543210. Leave blank to hide.",
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Site settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Brand name, contact details and header/footer text — no code changes needed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Settings saved. Changes appear on the site within a minute.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <field.icon size={14} className="text-gray-400" />
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  value={settings[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={settings[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              )}
              {field.help && (
                <p className="text-xs text-gray-400 mt-1">{field.help}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save settings"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        </div>
      </form>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
        <strong>Not editable here (env vars on Vercel):</strong> domain/site URL
        (<code>NEXT_PUBLIC_SITE_URL</code>), Razorpay keys, database URL, email
        API keys, admin login credentials. Those stay in environment settings so
        secrets are never in the database.
      </div>
    </div>
  );
}
