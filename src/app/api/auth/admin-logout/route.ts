import { NextResponse } from "next/server";

/** Clears the admin session cookie. Called by the admin panel's Sign Out button. */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
