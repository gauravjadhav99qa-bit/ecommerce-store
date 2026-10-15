import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSignupTicket, createLoginResponse } from "@/lib/auth-login";

export async function POST(req: NextRequest) {
  try {
    const { ticket, firstName, lastName, email, phone } = await req.json();

    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const mail = String(email || "").trim();
    const mobile = String(phone || "").trim();

    if (!first) return NextResponse.json({ error: "First name is required" }, { status: 400 });
    if (!last) return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    }

    // The OTP-verified identifier from the sign-in screen must be preserved.
    const claim = await readSignupTicket(ticket);
    if (!claim) {
      return NextResponse.json({ error: "Sign-in session expired. Please start again." }, { status: 401 });
    }
    if (claim.channel === "phone" && mobile !== claim.identifier) {
      return NextResponse.json({ error: "Keep the verified mobile number unchanged" }, { status: 400 });
    }
    if (claim.channel === "email" && mail !== claim.identifier) {
      return NextResponse.json({ error: "Keep the verified email unchanged" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: mail } });
    if (existingEmail) {
      return NextResponse.json({ error: "This email is already registered — please sign in with it." }, { status: 400 });
    }
    const existingPhone = await prisma.user.findUnique({ where: { phone: mobile } });
    if (existingPhone) {
      return NextResponse.json({ error: "This mobile number is already registered — please sign in with it." }, { status: 400 });
    }

    const now = new Date();
    const user = await prisma.user.create({
      data: {
        name: `${first} ${last}`.trim(),
        firstName: first,
        lastName: last,
        email: mail,
        phone: mobile,
        emailVerified: claim.channel === "email" ? now : null,
        phoneVerified: claim.channel === "phone" ? now : null,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        gender: true,
        dob: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    // Auto-login straight after signup.
    return createLoginResponse(user);
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
