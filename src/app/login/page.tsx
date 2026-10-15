"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AlertTriangle, Smartphone, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

type Channel = "email" | "phone";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Channel>("email");

  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailTestMode, setEmailTestMode] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResendIn, setEmailResendIn] = useState(0);

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneTestMode, setPhoneTestMode] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [sendingPhone, setSendingPhone] = useState(false);
  const [phoneResendIn, setPhoneResendIn] = useState(0);

  const isCheckoutRedirect = callbackUrl === "/checkout";

  useEffect(() => {
    if (emailResendIn <= 0) return;
    const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [emailResendIn]);

  useEffect(() => {
    if (phoneResendIn <= 0) return;
    const t = setTimeout(() => setPhoneResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneResendIn]);

  const sendEmailOtp = async () => {
    setError("");
    setEmailSuccess("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch("/api/otp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP");
        return;
      }
      setEmailSent(true);
      setEmailTestMode(Boolean(data.testMode));
      setEmailSuccess(`OTP sent to ${email} (valid 10 min)`);
      setEmailResendIn(45);
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const sendPhoneOtp = async () => {
    setError("");
    setPhoneSuccess("");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setSendingPhone(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP");
        return;
      }
      setPhoneSent(true);
      setPhoneTestMode(Boolean(data.testMode));
      setPhoneSuccess(`OTP sent to +91 ${phone} (valid 10 min)`);
      setPhoneResendIn(45);
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setSendingPhone(false);
    }
  };

  const otpLogin = async (payload: Record<string, string>, sent: boolean) => {
    if (!sent) {
      setError("Please send the OTP first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setLoading(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Channel) => {
    setMode(m);
    setError("");
  };

  const inputCls =
    "w-full bg-cream border border-cream-dark rounded-xl px-4 py-3 min-h-[48px] text-[15px] text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-berry focus:border-berry transition-shadow";
  const primaryBtn =
    "w-full bg-berry text-white rounded-full font-semibold py-3.5 min-h-[48px] text-[15px] hover:bg-berry-dark disabled:opacity-50 shadow-lg shadow-berry/20 transition-colors flex items-center justify-center gap-2";
  const sendBtn =
    "px-4 bg-ink text-cream rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 min-h-[44px] flex-shrink-0 transition-colors";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {callbackUrl !== "/" && (
          <div className="bg-marigold/10 border border-marigold/40 rounded-2xl p-3.5 sm:p-4 mb-4 sm:mb-5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-marigold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">
                {isCheckoutRedirect ? "Login to proceed with checkout" : "Login required to access this page"}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">Please sign in to continue</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-cream-dark shadow-[0_20px_60px_-25px_rgba(43,33,24,0.3)] overflow-hidden">
          {/* Card header */}
          <div className="px-6 sm:px-8 pt-7 pb-5 text-center border-b border-cream-dark">
            <div className="flex justify-center">
              <Logo size="default" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink mt-3.5">Sign in</h1>
            <p className="text-sm text-ink-soft mt-1">to access your orders, downloads &amp; more</p>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {/* Method tabs */}
            <div className="flex bg-cream border border-cream-dark rounded-full p-1 mb-5">
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[42px] ${
                  mode === "email" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Mail size={15} />
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[42px] ${
                  mode === "phone" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Smartphone size={15} />
                Mobile OTP
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {mode === "email" ? (
              <>
                {emailSuccess && (
                  <div className="bg-sage/10 border border-sage/30 text-ink px-4 py-3 rounded-xl mb-4 text-sm">
                    {emailSuccess}
                    {emailTestMode && <span className="block text-xs text-ink-soft mt-0.5">Test mode — OTP is 123456</span>}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    otpLogin({ email, code: emailCode }, emailSent);
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`${inputCls} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        onClick={sendEmailOtp}
                        disabled={sendingEmail || emailResendIn > 0 || !email}
                        className={sendBtn}
                      >
                        {sendingEmail
                          ? "Sending..."
                          : emailResendIn > 0
                            ? `${emailResendIn}s`
                            : emailSent
                              ? "Resend"
                              : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5">OTP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      placeholder="6-digit code"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className={`${inputCls} tracking-[0.35em] text-center text-lg font-semibold`}
                    />
                  </div>

                  <button type="submit" disabled={loading || !emailSent || emailCode.length !== 6} className={primaryBtn}>
                    {loading ? "Verifying..." : "Continue"}
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
                <p className="text-[11px] text-ink-soft text-center mt-3">
                  We&apos;ll email a 6-digit code — valid for 10 minutes
                </p>
              </>
            ) : (
              <>
                {phoneSuccess && (
                  <div className="bg-sage/10 border border-sage/30 text-ink px-4 py-3 rounded-xl mb-4 text-sm">
                    {phoneSuccess}
                    {phoneTestMode && <span className="block text-xs text-ink-soft mt-0.5">Test mode — OTP is 123456</span>}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    otpLogin({ phone, code: phoneCode }, phoneSent);
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex flex-1 min-w-0">
                        <span className="flex items-center px-3.5 bg-cream border border-r-0 border-cream-dark rounded-l-xl text-sm font-medium text-ink-soft">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          required
                          placeholder="9876543210"
                          maxLength={10}
                          autoComplete="tel-national"
                          className={`${inputCls} rounded-l-none`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={sendPhoneOtp}
                        disabled={sendingPhone || phoneResendIn > 0 || phone.length !== 10}
                        className={sendBtn}
                      >
                        {sendingPhone
                          ? "Sending..."
                          : phoneResendIn > 0
                            ? `${phoneResendIn}s`
                            : phoneSent
                              ? "Resend"
                              : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5">OTP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      placeholder="6-digit code"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className={`${inputCls} tracking-[0.35em] text-center text-lg font-semibold`}
                    />
                  </div>

                  <button type="submit" disabled={loading || !phoneSent || phoneCode.length !== 6} className={primaryBtn}>
                    {loading ? "Verifying..." : "Continue"}
                    {!loading && <ArrowRight size={17} />}
                  </button>
                </form>
                <p className="text-[11px] text-ink-soft text-center mt-3">
                  We&apos;ll text a 6-digit code — valid for 10 minutes
                </p>
              </>
            )}
          </div>

          {/* Sign-up strip */}
          <div className="bg-cream border-t border-cream-dark px-6 sm:px-8 py-4 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">New to GT Shopping?</span>
            <Link
              href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="border border-ink text-ink px-4 py-2 rounded-full text-sm font-semibold hover:bg-ink hover:text-cream transition-colors whitespace-nowrap"
            >
              Create an account
            </Link>
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
