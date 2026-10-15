"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { AlertTriangle, LogIn, Smartphone, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "otp">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTestMode, setOtpTestMode] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const isCheckoutRedirect = callbackUrl === "/checkout";

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      setLoading(false);
      return;
    }
    if (!password) {
      setError("Enter your password");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password");
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

  const sendOtp = async () => {
    setError("");
    setOtpSuccess("");
    if (!/^[6-9]\d{9}$/.test(otpPhone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP");
        return;
      }
      setOtpSent(true);
      setOtpTestMode(Boolean(data.testMode));
      setOtpSuccess(`OTP sent to +91 ${otpPhone} (valid 10 min)`);
      setResendIn(45);
    } catch {
      setError("Could not send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
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

  const switchMode = (m: "password" | "otp") => {
    setMode(m);
    setError("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {callbackUrl !== "/" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {isCheckoutRedirect && "Login to proceed with checkout"}
              {!isCheckoutRedirect && "Login required to access this page"}
            </p>
            <p className="text-xs text-amber-600 mt-1">Please sign in to continue</p>
          </div>
        </div>
      )}

      <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">Sign In</h1>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-5 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors min-h-[40px] ${
            mode === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Mail size={15} />
          Email
        </button>
        <button
          type="button"
          onClick={() => switchMode("otp")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors min-h-[40px] ${
            mode === "otp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Smartphone size={15} />
          Mobile OTP
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
          {error}
        </div>
      )}
      {otpSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
          {otpSuccess}
          {otpTestMode && <span className="block text-xs mt-1">Test mode — OTP is 123456</span>}
        </div>
      )}

      {mode === "password" ? (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] text-sm sm:text-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px] text-sm sm:text-base font-medium flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="flex flex-1 min-w-0">
                <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                  +91
                </span>
                <input
                  type="tel"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  placeholder="9876543210"
                  maxLength={10}
                  autoComplete="tel-national"
                  className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] text-sm sm:text-base"
                />
              </div>
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp || resendIn > 0 || otpPhone.length !== 10}
                className="px-3 sm:px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 min-h-[44px] flex-shrink-0"
              >
                {sendingOtp ? "Sending..." : resendIn > 0 ? `${resendIn}s` : otpSent ? "Resend" : "Send OTP"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="6-digit code"
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] text-sm sm:text-base tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !otpSent || otpCode.length !== 6}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px] text-sm sm:text-base font-medium flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            We&apos;ll send a 6-digit code to your registered mobile number
          </p>
        </form>
      )}

      <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-blue-600 font-medium hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-center py-8 text-gray-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
