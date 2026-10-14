"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, FolderOpen, Menu, X, Tag, Settings } from "lucide-react";

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
      {/* Mobile overlay + slide-in drawer (rendered outside any backdrop-blur container so position:fixed works) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[70] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-label="Admin menu"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-y-0 left-0 w-[85%] max-w-xs bg-white z-[80] lg:hidden transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
        </nav>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-50">
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

      <div className="flex min-h-screen">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
