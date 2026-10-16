import { NextResponse } from "next/server";
import { encode, decode, type JWT } from "next-auth/jwt";

const MAX_AGE = 365 * 24 * 60 * 60 * 10;
const TICKET_MAX_AGE = 10 * 60;

interface LoginUser {
  id: string;
  role: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: Date | null;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  phoneVerified: Date | null;
}

/** Builds the standard session response for a logged-in storefront customer. */
export async function createLoginResponse(user: LoginUser): Promise<NextResponse> {
  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      // Storefront sessions are always customer-scoped. An ADMIN signing in
      // through the customer OTP flow must NOT receive admin powers here —
      // admin access is only issued by /api/auth/admin-login via the
      // separate `admin-token` cookie. This prevents the two panels mixing.
      role: "CUSTOMER",
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
    maxAge: MAX_AGE,
  });

  const response = NextResponse.json({ success: true });
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
  // Single customer cookie only. NextAuth's signOut() deletes exactly this
  // name — never set a `__Secure-` duplicate, or signout leaves an orphan
  // session that keeps the user "half logged in" forever.
  response.cookies.set("next-auth.session-token", token, { ...cookieOpts, secure: false });
  // Clean up any legacy duplicate from older logins so old browsers recover.
  response.cookies.set("__Secure-next-auth.session-token", "", {
    ...cookieOpts,
    maxAge: 0,
  });
  return response;
}

export type SignupChannel = "email" | "phone";

/**
 * Issues a short-lived (10 min) signed ticket proving the identifier passed
 * OTP verification, handed to the signup form for new users.
 */
export async function createSignupTicket(identifier: string, channel: SignupChannel): Promise<string> {
  return encode({
    token: { purpose: "signup", identifier, channel } as unknown as JWT,
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: TICKET_MAX_AGE,
  });
}

export async function readSignupTicket(
  ticket: string | undefined
): Promise<{ identifier: string; channel: SignupChannel } | null> {
  if (!ticket) return null;
  try {
    const payload = await decode({ token: ticket, secret: process.env.NEXTAUTH_SECRET! });
    if (
      payload?.purpose === "signup" &&
      typeof payload.identifier === "string" &&
      (payload.channel === "email" || payload.channel === "phone")
    ) {
      return { identifier: payload.identifier, channel: payload.channel };
    }
    return null;
  } catch {
    return null;
  }
}
