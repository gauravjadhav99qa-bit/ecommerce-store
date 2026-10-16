import { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf(
    "sha256",
    keyMaterial,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`,
    32
  );
}

async function decryptToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    const encryptionSecret = await getDerivedEncryptionKey(secret, "");
    const { payload } = await jwtDecrypt(token, encryptionSecret, {
      clockTolerance: 15,
    });
    if (payload.id && payload.role) {
      return {
        id: payload.id as string,
        name: (payload.name as string) || null,
        email: (payload.email as string) || null,
        phone: (payload.phone as string) || null,
        role: payload.role as string,
        emailVerified: Boolean(payload.emailVerified),
        phoneVerified: Boolean(payload.phoneVerified),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  // Prefer a valid ADMIN session so an admin who is ALSO signed in as a
  // customer (both cookies in one browser) is not locked out of admin APIs.
  // The legacy `__Secure-next-auth.session-token` duplicate is intentionally
  // ignored — it survived signout and kept stale sessions alive.
  const adminToken = req.cookies.get("admin-token")?.value;
  if (adminToken) {
    const adminUser = await decryptToken(adminToken);
    if (adminUser?.role === "ADMIN") return adminUser;
  }
  const token = req.cookies.get("next-auth.session-token")?.value;
  if (!token) return null;
  const user = await decryptToken(token);
  if (!user) return null;
  // Storefront cookies never grant admin power. Legacy cookies issued before
  // the cookie split may still say ADMIN — downgrade them; real admin access
  // only ever comes from the `admin-token` branch above.
  if (user.role === "ADMIN") return { ...user, role: "CUSTOMER" };
  return user;
}

/** Optional check for email/mobile verification. Not required for payment. */
export function isPaymentVerified(user: SessionUser | null | undefined): boolean {
  return Boolean(user?.emailVerified && user?.phoneVerified);
}
