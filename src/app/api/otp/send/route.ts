import { NextRequest, NextResponse } from "next/server";
import { createAndSendOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(String(phone))) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }

    const p = purpose === "signup" ? "signup" : "login";
    const result = await createAndSendOtp(String(phone), p);

    if (!result.sent) {
      return NextResponse.json({ error: "Could not send OTP. Please try again." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      expiresInMinutes: 10,
      testMode: result.testMode,
    });
  } catch (error) {
    console.error("[OTP SEND]", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
