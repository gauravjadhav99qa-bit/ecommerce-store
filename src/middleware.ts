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

  // Customer and admin sessions are now separate cookies. Never fall back to
  // the legacy `__Secure-next-auth.session-token` duplicate — it is what used
  // to survive signout and dead-end the Sign In button.
  const customerToken = request.cookies.get("next-auth.session-token")?.value;
  const adminToken = request.cookies.get("admin-token")?.value;

  const noStore = (res: NextResponse) => {
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  };

  // Allow admin login page without auth
  if (adminLoginRoutes.includes(pathname)) {
    if (adminToken) {
      const payload = await decryptToken(adminToken);
      if (payload?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return noStore(NextResponse.next());
  }

  // Redirect logged-in CUSTOMERS away from login/register. Only a VALID
  // token counts — a stale or corrupted cookie must never dead-end the
  // Sign In button. An admin who is only signed into the admin panel may
  // still open the storefront login.
  if (authRoutes.includes(pathname) && customerToken) {
    const payload = await decryptToken(customerToken);
    if (payload) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Checkout is guest-friendly: auth is enforced server-side per order.

  // Protect admin routes - require the ADMIN session cookie
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const payload = await decryptToken(adminToken);
    if (payload?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
    return noStore(NextResponse.next());
  }

  // Auth-sensitive customer pages must never be cached, so login/logout
  // always reflects the latest cookie state.
  if (
    pathname.startsWith("/account") ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/wishlist"
  ) {
    return noStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|logo-white.svg|.*\\..*).*)"],
};
