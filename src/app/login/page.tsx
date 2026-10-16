"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AlertTriangle, ShieldCheck, ArrowRight, ArrowLeft, Mail, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

function isEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const isCheckoutRedirect = callbackUrl === "/checkout";

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendOtp = async (addr: string) => {
    setError("");
    setNotice("");
    setSending(true);
    try {
      const res = await fetch("/api/otp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addr, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP. Please try again.");
        return;
      }
      setTestMode(Boolean(data.testMode));
      setNotice(`Code sent to ${addr}`);
      setStep("otp");
      setCode("");
      setResendIn(45);
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    await sendOtp(email.trim());
  };

  const handleResend = async () => {
    if (email && resendIn === 0) await sendOtp(email.trim());
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }
      if (data.needsSignup) {
        const params = new URLSearchParams({
          ticket: data.ticket,
          identifier: data.identifier,
          channel: data.channel,
        });
        if (callbackUrl !== "/") params.set("callbackUrl", callbackUrl);
        window.location.href = `/register?${params.toString()}`;
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const inputCls =
    "w-full bg-cream border border-cream-dark rounded-xl px-4 py-3.5 min-h-[52px] text-[15px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-berry focus:border-berry transition-shadow";
  const primaryBtn =
    "w-full bg-berry text-white rounded-full font-semibold py-3.5 min-h-[50px] text-[15px] hover:bg-berry-dark disabled:opacity-50 shadow-lg shadow-berry/20 transition-colors flex items-center justify-center gap-2";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {callbackUrl !== "/" && (
          <div className="bg-marigold/10 border border-marigold/40 rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-marigold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">
                {isCheckoutRedirect ? "Sign in to proceed with checkout" : "Sign in required to access this page"}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">Please sign in to continue</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-cream-dark shadow-[0_20px_60px_-25px_rgba(43,33,24,0.3)] overflow-hidden">
          <div className="px-6 sm:px-8 pt-7 pb-5 text-center border-b border-cream-dark">
            <div className="flex justify-center">
              <Logo size="default" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink mt-3.5">
              {step === "identifier" ? "Sign in or sign up" : "Enter the code"}
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              {step === "identifier"
                ? "One tap — your email is all you need"
                : `We emailed a 6-digit code to ${email}`}
            </p>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {step === "identifier" ? (
              <form onSubmit={handleContinue} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>
                <button type="submit" disabled={sending || !email.trim()} className={primaryBtn}>
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-ink-soft text-center leading-relaxed">
                  We&apos;ll send a 6-digit code to verify it&apos;s you — no password needed
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                {notice && (
                  <div className="bg-sage/10 border border-sage/30 text-ink px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <Mail size={15} />
                    <span>
                      {notice}
                      {testMode && <span className="block text-xs text-ink-soft mt-0.5">Test mode — code is 123456</span>}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5">OTP Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus
                    placeholder="6-digit code"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className={`${inputCls} tracking-[0.4em] text-center text-xl font-bold`}
                  />
                </div>

                <button type="submit" disabled={verifying || code.length !== 6} className={primaryBtn}>
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[13px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("identifier");
                      setError("");
                      setNotice("");
                      setCode("");
                    }}
                    className="flex items-center gap-1 text-ink-soft hover:text-ink font-medium"
                  >
                    <ArrowLeft size={14} />
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendIn > 0 || sending}
                    className="text-berry font-semibold hover:text-berry-dark disabled:opacity-50"
                  >
                    {sending ? "Sending..." : resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-ink-soft">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
