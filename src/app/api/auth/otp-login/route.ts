import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createLoginResponse, createSignupTicket } from "@/lib/auth-login";

export async function POST(req: NextRequest) {
  try {
    const { phone, email, code } = await req.json();

    const isEmail = Boolean(email);
    const identifier = (email ? String(email) : String(phone || "")).trim();

    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      }
    } else if (!identifier || !/^[6-9]\d{9}$/.test(identifier)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
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
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { phone: identifier } });
    if (user) {
      return createLoginResponse(user);
    }

    // 3) New user → short-lived signup ticket (OTP already proven).
    const ticket = await createSignupTicket(identifier, isEmail ? "email" : "phone");
    return NextResponse.json({
      needsSignup: true,
      ticket,
      identifier,
      channel: isEmail ? "email" : "phone",
    });
  } catch (error) {
    console.error("[OTP-LOGIN]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
