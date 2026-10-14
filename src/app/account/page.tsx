"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  LogOut,
  Phone,
  Mail,
  Download,
  Heart,
  ChevronRight,
  Check,
} from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
}

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({
        firstName: session.user.firstName || "",
        lastName: session.user.lastName || "",
        gender: session.user.gender || "",
        dob: session.user.dob ? session.user.dob.split("T")[0] : "",
        email: session.user.email || "",
        phone: session.user.phone || "",
      });
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const initials = [profile.firstName, profile.lastName]
    .map((n) => n?.charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase() || session.user?.name?.charAt(0)?.toUpperCase() || "U";

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || session.user?.name || "User";

  const handleUpdate = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        await update();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { icon: Package, label: "My Orders", href: "/account/orders" },
    { icon: Download, label: "My Downloads", href: "/account/downloads" },
    { icon: Phone, label: "Phone Number", href: null },
    { icon: Mail, label: "Email Address", href: null },
    { icon: Heart, label: "My Wishlist", href: "/wishlist" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        MY ACCOUNT
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              My Profile
            </h2>

            <div className="space-y-5">
              {/* First Name / Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Date of Birth / Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) =>
                      setProfile({ ...profile, dob: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.phone}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                    />
                    {profile.phone && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check size={14} className="text-green-500" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                  />
                  {profile.email && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Check size={14} className="text-green-500" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="flex items-center gap-6">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={g.toLowerCase()}
                        checked={profile.gender === g.toLowerCase()}
                        onChange={(e) =>
                          setProfile({ ...profile, gender: e.target.value })
                        }
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                      />
                      <span className="text-sm text-gray-700">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  "Updating..."
                ) : saved ? (
                  <>
                    <Check size={16} />
                    Updated Successfully
                  </>
                ) : (
                  "UPDATE"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
              <Link
                href="/account"
                className="text-sm text-gray-500 hover:text-gray-700 mt-1"
              >
                Edit Profile
              </Link>
            </div>

            {/* Menu Items */}
            <div className="border-t border-gray-100 pt-4 space-y-1">
              {menuItems.map((item) => (
                <div key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <item.icon size={18} className="text-gray-400 group-hover:text-gray-600" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <item.icon size={18} className="text-gray-400 group-hover:text-gray-600" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 mt-4 pt-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
