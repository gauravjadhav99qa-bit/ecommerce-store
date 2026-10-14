import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        phone,
        password: hashedPassword,
      },
      select: { id: true, name: true, phone: true, email: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
