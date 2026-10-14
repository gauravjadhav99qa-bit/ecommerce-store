import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        phoneVerified: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, password, role } = await req.json();

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
    if (role && !["ADMIN", "CUSTOMER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    // Only one admin account is allowed
    if (role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount >= 1) {
        return NextResponse.json(
          { error: "Only one admin account is allowed" },
          { status: 400 }
        );
      }
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
        role: role || "CUSTOMER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[ADMIN-USER-CREATE]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = await req.json();

    if (!id || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    if (!["ADMIN", "CUSTOMER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Single-admin store: no new ADMIN accounts, no demoting yourself or the last admin.
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (role === "ADMIN" && target.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only one admin account is allowed. Promote is disabled." },
        { status: 400 }
      );
    }

    if (role === "CUSTOMER" && target.role === "ADMIN") {
      if (id === session.id) {
        return NextResponse.json(
          { error: "You cannot change your own admin role" },
          { status: 400 }
        );
      }
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only admin account" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({ where: { id }, data: { role } });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted" },
        { status: 400 }
      );
    }

    if (target._count.orders > 0 || target._count.reviews > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete user with ${target._count.orders} order(s) and ${target._count.reviews} review(s). Remove their orders first.`,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete user: has related data (orders/reviews). Remove related data first." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
