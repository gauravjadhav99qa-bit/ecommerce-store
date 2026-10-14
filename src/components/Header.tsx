"use client";

import Link from "next/link";
import { useCart } from "@/stores/cart";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  ChevronRight,
  LogOut,
  Package,
  Shield,
  Download,
  Heart,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "@/components/Logo";
import { useWishlist } from "@/stores/wishlist";

type CategoryLink = { name: string; slug: string };

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [announcement, setAnnouncement] = useState(
    "Instant PDF downloads — print at home today."
  );
  const itemCount = useCart((s) => s.getItemCount());
  const wishlistCount = useWishlist((s) => s.items.length);
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch(() => {});
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.announcement) setAnnouncement(data.announcement);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-cream text-center text-xs sm:text-sm py-2 px-4">
        <span className="font-medium">{announcement}</span>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-cream-dark shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 -ml-2 text-ink active:text-berry"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            <Link href="/" className="flex-shrink-0 flex items-center">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              <Link
                href="/products"
                className="text-sm font-semibold text-ink-soft hover:text-berry transition-colors"
              >
                Shop
              </Link>
              <Link
                href="/products?category=bundles"
                className="text-sm font-semibold text-ink-soft hover:text-berry transition-colors"
              >
                Bundles
              </Link>
              <Link
                href="/free"
                className="text-sm font-semibold text-berry hover:text-berry-dark transition-colors"
              >
                Free samples
              </Link>
              <Link
                href="/faq"
                className="text-sm font-semibold text-ink-soft hover:text-berry transition-colors"
              >
                FAQ
              </Link>
            </nav>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-ink-soft hover:text-berry"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              <Link
                href={session ? (isAdmin ? "/admin" : "/account") : "/login"}
                className="p-2 text-ink-soft hover:text-berry"
                aria-label="Account"
              >
                <User size={20} />
              </Link>

              <Link
                href="/wishlist"
                className="p-2 text-ink-soft hover:text-berry relative"
                aria-label="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-berry text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="p-2 text-ink-soft hover:text-berry relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-berry text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {searchOpen && (
            <div className="pb-3 md:pb-4">
              <form action="/products" method="get" className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
                />
                <input
                  type="text"
                  name="search"
                  placeholder="Search colouring books, worksheets, planners..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-cream border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-berry focus:border-transparent"
                />
              </form>
            </div>
          )}
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div
          className={`fixed top-0 left-0 right-0 bottom-0 bg-white z-50 md:hidden transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-cream-dark">
            <Logo size="sm" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-ink"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="px-4 py-4 overflow-y-auto">
            <div className="space-y-1">
              {[
                { href: "/products", label: "Shop all" },
                { href: "/free", label: "Free samples" },
                { href: "/products?category=bundles", label: "Bundles" },
                { href: "/faq", label: "FAQ" },
                { href: "/about", label: "About" },
                ...categories.map((c) => ({
                  href: `/products?category=${c.slug}`,
                  label: c.name,
                })),
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-ink border-b border-cream-dark"
                >
                  <span className="text-sm font-medium">{link.label}</span>
                  <ChevronRight size={16} className="text-ink-soft/50" />
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-cream-dark">
              {session ? (
                <>
                  <div className="py-2.5 border-b border-cream-dark">
                    <p className="text-sm font-medium text-ink">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-ink-soft">{session.user?.email}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? "bg-marigold/20 text-marigold"
                          : "bg-berry/10 text-berry"
                      }`}
                    >
                      {isAdmin ? "Admin" : "Customer"}
                    </span>
                  </div>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                    >
                      <Shield size={18} /> Admin Panel
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                      >
                        <User size={18} /> Account
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                      >
                        <Package size={18} /> My Orders
                      </Link>
                      <Link
                        href="/account/downloads"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                      >
                        <Download size={18} /> My Downloads
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                      >
                        <Heart size={18} /> Wishlist
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 py-3 text-sm font-medium text-berry-dark"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-sm font-medium text-ink border-b border-cream-dark"
                  >
                    <Heart size={18} /> Wishlist
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-sm font-medium text-ink"
                  >
                    <User size={18} /> Sign In / Register
                  </Link>
                </>
              )}
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-sm font-medium text-ink"
              >
                <ShoppingBag size={18} /> Cart ({itemCount})
              </Link>
              <p className="flex items-center gap-2 py-3 text-xs text-ink-soft">
                <Sparkles size={14} className="text-marigold" /> Instant download
                after payment
              </p>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
