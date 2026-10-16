"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderOpen, Menu, X, Tag, Settings, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
    } catch {
      // ignore — still redirect
    }
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile overlay + slide-in drawer. Mounted only while open so the
          off-screen translated layer can't ghost/mispaint after pinch-zoom. */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[70] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Admin menu"
          className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-[80] lg:hidden shadow-2xl animate-slide-in-left"
        >
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          <h2 className="text-base font-bold">Admin Panel</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="px-4 py-4 space-y-1 overflow-y-auto h-[calc(100%-3.5rem)]">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
          >
            <LogOut size={18} />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </nav>
      </div>
      )}

      {/* Mobile top bar. Fixed with left/right insets so it always paints at
          full viewport width — sticky headers misrender at partial width after
          pinch-zoom on Android Chrome. */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Admin Panel</h2>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* pt on mobile compensates for the fixed top bar (44px button + 16px padding + 1px border). */}
      <div className="flex min-h-screen pt-[61px] lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-6 px-3">Admin Panel</h2>
          <nav className="space-y-1 flex-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleSignOut}
            className="mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
