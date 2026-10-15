import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { phone, email, code } = await req.json();

    const identifier = email ? String(email).trim() : String(phone || "").trim();

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      }
    } else if (!identifier || !/^[6-9]\d{9}$/.test(identifier)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "OTP code required" }, { status: 400 });
    }

    const user = email
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { phone: identifier } });
    if (!user) {
      return NextResponse.json(
        {
          error: email
            ? "No account with this email. Please sign up first."
            : "No account with this number. Please sign up first.",
        },
        { status: 404 }
      );
    }

    const valid = await verifyOtp(identifier, String(code));
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const maxAge = 365 * 24 * 60 * 60 * 10;

    const token = await encode({
      token: {
        sub: user.id,
        id: user.id,
        role: user.role,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        dob: user.dob?.toISOString() || null,
        name: user.name,
        email: user.email,
        picture: user.image,
        emailVerified: Boolean(user.emailVerified),
        phoneVerified: Boolean(user.phoneVerified),
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge,
    });

    const response = NextResponse.json({ success: true });

    const cookieOpts = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge,
    };

    response.cookies.set("__Secure-next-auth.session-token", token, cookieOpts);
    response.cookies.set("next-auth.session-token", token, { ...cookieOpts, secure: false });

    return response;
  } catch (error) {
    console.error("[OTP-LOGIN]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
