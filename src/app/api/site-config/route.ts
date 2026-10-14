import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

/** Public: site name, announcement bar, contact email for header/footer. */
export async function GET() {
  const s = await getSiteSettings();
  return NextResponse.json({
    siteName: s.siteName,
    announcement: s.announcement,
    contactEmail: s.contactEmail,
    supportPhone: s.supportPhone,
    whatsapp: s.whatsapp,
    footerNote: s.footerNote,
    paymentMode: s.paymentMode,
  });
}
