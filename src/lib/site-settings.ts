import { prisma } from "@/lib/prisma";

export type SiteSettings = {
  siteName: string;
  contactEmail: string;
  announcement: string;
  supportPhone: string;
  whatsapp: string;
  footerNote: string;
  paymentMode: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "GT Shopping",
  contactEmail: "hello@gtshoppingonline.in",
  announcement: "Instant PDF downloads — print at home today. Bundle deals save up to 35%.",
  supportPhone: "",
  whatsapp: "",
  footerNote: "Digital printables · Instant download after payment",
  paymentMode: "live",
};

const KEYS: (keyof SiteSettings)[] = [
  "siteName",
  "contactEmail",
  "announcement",
  "supportPhone",
  "whatsapp",
  "footerNote",
  "paymentMode",
];

/** Read all site settings from DB, falling back to defaults. Cached ~60s. */
let cache: { data: SiteSettings; at: number } | null = null;
const CACHE_MS = 60_000;

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    const rows = await prisma.storeSettings.findMany({
      where: { key: { in: KEYS } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const data: SiteSettings = {
      siteName: map.siteName || DEFAULT_SETTINGS.siteName,
      contactEmail: map.contactEmail || DEFAULT_SETTINGS.contactEmail,
      announcement: map.announcement || DEFAULT_SETTINGS.announcement,
      supportPhone: map.supportPhone || "",
      whatsapp: map.whatsapp || "",
      footerNote: map.footerNote || DEFAULT_SETTINGS.footerNote,
      paymentMode: map.paymentMode === "test" ? "test" : "live",
    };
    cache = { data, at: Date.now() };
    return data;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function invalidateSettingsCache() {
  cache = null;
}

export async function saveSiteSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
  const entries = KEYS.filter((k) => input[k] !== undefined).map((k) => ({
    key: k,
    value:
      k === "paymentMode"
        ? String(input[k]) === "test"
          ? "test"
          : "live"
        : String(input[k] ?? "").slice(0, 2000),
  }));
  for (const e of entries) {
    await prisma.storeSettings.upsert({
      where: { key: e.key },
      update: { value: e.value },
      create: { key: e.key, value: e.value },
    });
  }
  invalidateSettingsCache();
  return getSiteSettings();
}
