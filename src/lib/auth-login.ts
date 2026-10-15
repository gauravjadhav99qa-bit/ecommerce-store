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

/** Builds the standard session response (both cookie variants) for a logged-in user. */
export async function createLoginResponse(user: LoginUser): Promise<NextResponse> {
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
  response.cookies.set("__Secure-next-auth.session-token", token, cookieOpts);
  response.cookies.set("next-auth.session-token", token, { ...cookieOpts, secure: false });
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
