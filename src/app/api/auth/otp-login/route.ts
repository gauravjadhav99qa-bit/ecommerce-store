import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createLoginResponse, createSignupTicket } from "@/lib/auth-login";

/** Email-OTP-only sign-in (SMS OTP has been removed from the storefront). */
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    const identifier = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "OTP code required" }, { status: 400 });
    }

    // 1) Verify OTP first (consumes the code) — before any user lookup.
    const valid = await verifyOtp(identifier, String(code));
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 2) Existing user → direct login.
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (user) {
      return createLoginResponse(user);
    }

    // 3) New user → short-lived signup ticket (OTP already proven).
    const ticket = await createSignupTicket(identifier, "email");
    return NextResponse.json({
      needsSignup: true,
      ticket,
      identifier,
      channel: "email",
    });
  } catch (error) {
    console.error("[OTP-LOGIN]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
