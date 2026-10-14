import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized as admin" }, { status: 403 });
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

    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    console.error("[ADMIN-LOGIN]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
