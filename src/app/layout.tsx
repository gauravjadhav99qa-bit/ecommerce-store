import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutShell from "@/components/LayoutShell";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getSiteSettings } from "@/lib/site-settings";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gtshoppingonline.in";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s.siteName || "GT Shopping";
  return {
    title: {
      default: `${name} — Printable Colouring Books & Activity PDFs`,
      template: `%s | ${name}`,
    },
    description:
      "Instant-download printable colouring books, kids' activity books, worksheets, planners and educational e-books. Print at home on A4 or US Letter. Secure checkout with Razorpay.",
    keywords: [
      "printable colouring books",
      "coloring book pdf",
      "kids coloring pages",
      "instant download coloring book",
      "animal coloring book",
      "mandala coloring pages",
      "dinosaur coloring book",
      "alphabet coloring pages",
      "preschool worksheets printable",
      "activity books for kids",
      "print at home coloring",
      "digital download coloring book",
      "unicorns coloring book",
      "sports coloring pages",
      "ocean animals coloring",
      "vehicles coloring book",
    ],
    authors: [{ name }],
    creator: name,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: name,
      title: `${name} — Printable Colouring Books & Activity PDFs`,
      description:
        "Instant-download printable colouring books, activity books, worksheets and planners. Print at home today.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Printable Colouring Books & Activity PDFs`,
      description:
        "Instant-download printable colouring books, activity books, worksheets and planners.",
      images: ["/og-image.png"],
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/favicon.png", sizes: "512x512" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const s = await getSiteSettings();
  const siteName = s.siteName || "GT Shopping";
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href={siteUrl} />
        <meta name="theme-color" content="#c2517e" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteName,
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/products?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${siteUrl}/#organization`,
              name: siteName,
              url: siteUrl,
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.png`,
                width: 1200,
                height: 630,
              },
              description:
                "Printable colouring books, activity books, worksheets and planners — instant PDF downloads.",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
