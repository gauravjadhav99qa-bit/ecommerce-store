"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { AlertTriangle, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isCheckoutRedirect = callbackUrl === "/checkout";

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
      <p className="text-center text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">
        Use the email and password set for your account
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
          {error}
        </div>
      )}

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
