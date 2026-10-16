"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import Logo from "@/components/Logo";

function SignupForm() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get("ticket") || "";
  const identifier = searchParams.get("identifier") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(identifier);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full bg-cream border border-cream-dark rounded-xl px-4 py-3 min-h-[48px] text-[15px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-berry focus:border-berry transition-shadow disabled:text-ink-soft disabled:cursor-not-allowed";
  const labelCls = "block text-[13px] font-semibold text-ink mb-1.5";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) return setError("First name is required");
    if (!lastName.trim()) return setError("Last name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Valid email is required");

    setSaving(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save your details");
        setSaving(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-cream-dark shadow-[0_20px_60px_-25px_rgba(43,33,24,0.3)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-7 pb-5 text-center border-b border-cream-dark">
            <div className="flex justify-center">
              <Logo size="default" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink mt-3.5">Create your account</h1>
            <p className="text-sm text-ink-soft mt-1">Email verified — just your details left</p>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {!ticket && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Your sign-in session expired. Please start again from the sign-in page.{" "}
                  <Link href="/login" className="font-semibold text-berry hover:underline">
                    Go to sign in →
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                    autoComplete="given-name"
                    placeholder="Aarav"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    placeholder="Sharma"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Email Address *<span className="text-sage font-medium"> · verified</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly={Boolean(identifier)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={saving || !ticket}
                className="w-full bg-berry text-white rounded-full font-semibold py-3.5 min-h-[50px] text-[15px] hover:bg-berry-dark disabled:opacity-50 shadow-lg shadow-berry/20 transition-colors flex items-center justify-center gap-2 mt-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-ink-soft text-center leading-relaxed">
                Your details are used for order receipts and downloads only
              </p>
            </form>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft mt-4">
          <ShieldCheck size={14} className="text-sage" />
          Secure sign-in · Instant PDF delivery after payment
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-ink-soft">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
