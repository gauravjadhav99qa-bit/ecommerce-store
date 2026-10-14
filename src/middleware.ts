import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

const adminRoutes = ["/admin"];
const adminLoginRoutes = ["/admin/login"];
const authRoutes = ["/login", "/register"];

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf(
    "sha256",
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`,
    32
  );
}

async function decryptToken(token: string): Promise<{ role?: string } | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    const encryptionSecret = await getDerivedEncryptionKey(secret, "");
    const { payload } = await jwtDecrypt(token, encryptionSecret, {
      clockTolerance: 15,
    });
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // www redirect — production only (skip localhost / dev)
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]") ||
    process.env.NODE_ENV === "development";
  if (!isLocal) {
    const siteHost =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
      "www.gtshoppingonline.in";
    const bareHost = siteHost.replace(/^www\./, "");
    if (host === bareHost && !pathname.startsWith("/api/")) {
      const wwwUrl = new URL(request.url);
      wwwUrl.hostname = `www.${bareHost}`;
      return NextResponse.redirect(wwwUrl, 308);
    }
  }

  const token = request.cookies.get("next-auth.session-token")?.value || request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Allow admin login page without auth
  if (adminLoginRoutes.includes(pathname)) {
    if (token) {
      const payload = await decryptToken(token);
      if (payload?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register (except admin)
  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Checkout is guest-friendly: auth is enforced server-side per order.

  // Protect admin routes - require ADMIN role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const payload = await decryptToken(token);
    if (payload?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-white.svg|.*\\..*).*)"],
};
