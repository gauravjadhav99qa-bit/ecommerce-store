import { NextRequest, NextResponse } from "next/server";
import { createAndSendEmailOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose = "login" } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (purpose !== "login" && purpose !== "signup") {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    const { sent, testMode } = await createAndSendEmailOtp(String(email), purpose);

    if (!sent) {
      return NextResponse.json({ error: "Could not send OTP email. Please try again." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      expiresInMinutes: 10,
      testMode,
    });
  } catch (error) {
    console.error("[OTP-EMAIL]", error);
    return NextResponse.json({ error: "Could not send OTP" }, { status: 500 });
  }
}
