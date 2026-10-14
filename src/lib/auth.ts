import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      gender: string | null;
      dob: string | null;
      email: string | null;
      phone: string | null;
      image: string | null;
      role: string;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }
  interface User {
    role: string;
    phone?: string | null;
    emailVerified?: boolean | Date | null;
    phoneVerified?: boolean | Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    dob: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            phone: user.phone,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          };
        } catch (error) {
          console.error("[AUTH] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 365 * 24 * 60 * 60 * 10 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone ?? null;
        token.emailVerified = Boolean(user.emailVerified);
        token.phoneVerified = Boolean(user.phoneVerified);
      }
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              name: true,
              role: true,
              phone: true,
              firstName: true,
              lastName: true,
              gender: true,
              dob: true,
              emailVerified: true,
              phoneVerified: true,
            },
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.gender = dbUser.gender;
            token.dob = dbUser.dob?.toISOString() || null;
            token.emailVerified = Boolean(dbUser.emailVerified);
            token.phoneVerified = Boolean(dbUser.phoneVerified);
          }
        } catch {
          // DB query failed — keep existing token values
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.gender = token.gender;
        session.user.dob = token.dob;
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.phoneVerified = Boolean(token.phoneVerified);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
