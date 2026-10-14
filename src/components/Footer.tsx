"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import Logo from "@/components/Logo";

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 md:py-0 md:pointer-events-none"
      >
        <h4 className="text-sm font-semibold text-cream font-display">{title}</h4>
        <span className="md:hidden text-cream/50">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <div className={`${open ? "block" : "hidden"} md:block pb-4 md:pb-0`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [siteName, setSiteName] = useState("GT Shopping");
  const [contactEmail, setContactEmail] = useState("hello@gtshoppingonline.in");

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.siteName) setSiteName(data.siteName);
        if (data?.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      setStatus(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="bg-ink text-cream/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="md:grid md:grid-cols-4 md:gap-8">
          <div className="py-6 md:py-0 border-b border-white/10 md:border-0 mb-6 md:mb-0">
            <Link href="/" className="inline-block">
              <Logo variant="light" />
            </Link>
            <p className="text-cream/60 text-sm leading-relaxed mt-3">
              Printable colouring books, activity books and planners —
              instant PDF downloads, print at home.
            </p>
          </div>

          <FooterSection title="Shop">
            <ul className="space-y-2.5">
              {[
                { href: "/products", label: "All products" },
                { href: "/products?category=animal-colouring", label: "Animal colouring" },
                { href: "/products?category=kids-colouring", label: "Kids' colouring" },
                { href: "/products?category=preschool-activity", label: "Preschool activity" },
                { href: "/products?category=bundles", label: "Bundles & deals" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/60 text-sm hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title="Help">
            <ul className="space-y-2.5">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/about", label: "About us" },
                { href: "/contact", label: "Contact" },
                { href: "/account/downloads", label: "My downloads" },
                { href: "/account/orders", label: "Order history" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/60 text-sm hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title="Policies">
            <ul className="space-y-2.5">
              {[
                { href: "/refund-policy", label: "Refund policy" },
                { href: "/privacy-policy", label: "Privacy policy" },
                { href: "/tc", label: "Terms & conditions" },
                { href: "/license", label: "Licence & permitted use" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/60 text-sm hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>
        </div>

        {/* Newsletter */}
        <div id="newsletter" className="border-t border-white/10 mt-8 pt-8 md:flex md:items-center md:justify-between md:gap-8 scroll-mt-24">
          <div className="mb-4 md:mb-0">
            <h4 className="text-sm font-semibold text-cream font-display">
              New printables in your inbox
            </h4>
            <p className="text-cream/50 text-xs mt-1">
              Occasional emails about new releases and bundle offers. Unsubscribe
              anytime.
            </p>
          </div>
          {status === "done" ? (
            <p className="flex items-center gap-2 text-sm text-sage">
              <Check size={16} /> You&apos;re subscribed. Thank you!
            </p>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="flex-1 md:w-64 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-berry"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 py-2 bg-berry hover:bg-berry-dark text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {status === "loading" ? "..." : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="text-xs text-marigold mt-2">
              Could not subscribe — please try again.
            </p>
          )}
        </div>

        <div className="border-t border-white/10 mt-6 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-xs text-center md:text-left">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-cream/40 text-xs">Secure payments</span>
            <div className="flex gap-2">
              {["UPI", "Cards", "Netbanking"].map((method) => (
                <span
                  key={method}
                  className="bg-white/10 text-cream/60 text-[10px] font-bold px-2 py-1 rounded"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
