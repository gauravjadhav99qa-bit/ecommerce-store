"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "@/components/Logo";
import { useWishlist } from "@/stores/wishlist";

type CategoryLink = { name: string; slug: string };

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
};

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);
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
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`)
        .then((r) => r.json())
        .then((data) => {
          const list: Suggestion[] = (data?.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image: p.images ? JSON.parse(p.images)[0] : null,
          }));
          setSuggestions(list);
          setShowSuggestions(true);
          setHighlighted(-1);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (q: string) => {
    const query = q.trim();
    if (!query) return;
    setShowSuggestions(false);
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch(searchQuery);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && suggestions[highlighted]) {
        setShowSuggestions(false);
        setSearchOpen(false);
        router.push(`/products/${suggestions[highlighted].slug}`);
      } else {
        submitSearch(searchQuery);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

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
            <div className="pb-3 md:pb-4" ref={searchWrapRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch(searchQuery);
                }}
                className="relative"
              >
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60 z-10"
                />
                <input
                  type="text"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search colouring books, worksheets, planners..."
                  autoFocus
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-cream border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-berry focus:border-transparent"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-cream-dark rounded-lg shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <Link
                        key={s.id}
                        href={`/products/${s.slug}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchOpen(false);
                        }}
                        onMouseEnter={() => setHighlighted(i)}
                        className={`flex items-center gap-3 px-3 py-2.5 border-b border-cream-dark last:border-0 transition-colors ${
                          i === highlighted ? "bg-cream" : "bg-white"
                        }`}
                      >
                        {s.image && (
                          <img
                            src={s.image}
                            alt=""
                            className="w-8 h-9 object-contain bg-cream rounded flex-shrink-0"
                          />
                        )}
                        <span className="flex-1 text-sm text-ink truncate">
                          {s.name}
                        </span>
                        <span className="text-xs font-semibold text-berry flex-shrink-0">
                          ₹{(s.price / 100).toFixed(0)}
                        </span>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => submitSearch(searchQuery)}
                      className="w-full text-left px-3 py-2.5 bg-cream text-sm font-semibold text-berry hover:bg-cream-dark transition-colors"
                    >
                      See all results for “{searchQuery.trim()}” →
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile menu — outside header so position:fixed is viewport-relative
          (header's backdrop-blur would otherwise trap it) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[70] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-[80] md:hidden transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Menu"
        aria-hidden={!mobileMenuOpen}
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

        <nav className="px-4 py-4 overflow-y-auto h-[calc(100%-3.5rem)]">
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
                    // Explicit callbackUrl forces a full reload to a logged-out
                    // page, so no stale session state is cached across tabs.
                    signOut({ callbackUrl: "/" });
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
    </>
  );
}
