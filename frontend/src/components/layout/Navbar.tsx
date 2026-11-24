"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, PlusCircle, Compass, 
  BarChart3, ShieldCheck, ChevronDown, LogOut,
  MapPin, Store, CalendarCheck, Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/Button";
import { UserRole } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchDemoRole } = useAuth();
  const { currentLocation, openModal: openLocationModal } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "food_provider": return "/provider";
      case "recipient": return "/recipient";
      case "volunteer": return "/volunteer";
      case "admin": return "/admin";
      default: return "/discover";
    }
  };

  const rolesList: { role: UserRole; label: string; badge: string }[] = [
    { role: "food_provider", label: "Taj Hotel (Provider)", badge: "Provider" },
    { role: "recipient", label: "Robin Hood Army (NGO)", badge: "Recipient" },
    { role: "volunteer", label: "Arjun Verma (Volunteer)", badge: "Volunteer" },
    { role: "admin", label: "Dr. Sunita (Admin)", badge: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-freshBg/80 backdrop-blur-md border-b border-freshBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <img
              src="/images/logo.png"
              alt="FoodLoop Logo"
              className="w-12 h-12 object-contain rounded-2xl shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-freshText-primary">FoodLoop</span>
              </div>
              <p className="text-[10px] text-freshText-secondary -mt-0.5 hidden sm:block font-semibold">
                Save Food • Share Food • Feed Better
              </p>
            </div>
          </Link>

          {/* Location Chooser Pill */}
          <button
            onClick={openLocationModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-freshBorder bg-white hover:border-[#258A54] hover:shadow-subtle transition-all text-xs font-semibold text-freshText-primary shadow-xs shrink-0"
            title="Change active location to see nearby surplus food"
          >
            <MapPin className="w-3.5 h-3.5 text-[#258A54] shrink-0" />
            <div className="text-left hidden xs:block">
              <span className="text-[10px] uppercase font-bold text-freshText-secondary block leading-none">Location</span>
              <span className="text-xs font-extrabold text-freshText-primary truncate max-w-[120px] sm:max-w-[160px] block leading-tight">
                {currentLocation.shortName}
              </span>
            </div>
            <span className="text-xs font-bold xs:hidden truncate max-w-[90px]">
              {currentLocation.shortName}
            </span>
            <ChevronDown className="w-3 h-3 text-freshText-secondary shrink-0 ml-0.5" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-freshBorder shadow-subtle">
            <Link
              href="/discover"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname === "/discover"
                  ? "bg-freshBg text-freshText-primary font-bold"
                  : "text-freshText-secondary hover:text-freshText-primary"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-lime-600" />
              Explore Food
            </Link>
            <Link
              href="/events"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/events")
                  ? "bg-red-50 text-red-600 font-bold border border-red-200"
                  : "text-freshText-secondary hover:text-red-600"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Event Rescue</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white">Weddings</span>
            </Link>
            <Link
              href="/recipients"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/recipients")
                  ? "bg-amber-50 text-amber-900 font-bold border border-amber-200"
                  : "text-freshText-secondary hover:text-amber-800"
              }`}
            >
              <span>🐾</span>
              <span>Animal Care & NGOs</span>
            </Link>
            <Link
              href="/donors"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname === "/donors"
                  ? "bg-freshBg text-freshText-primary font-bold"
                  : "text-freshText-secondary hover:text-freshText-primary"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              Donor Directory
            </Link>
            <Link
              href="/impact"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname === "/impact"
                  ? "bg-freshBg text-freshText-primary font-bold"
                  : "text-freshText-secondary hover:text-freshText-primary"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-freshSuccess" />
              Impact Metrics
            </Link>
            {user && (
              <Link
                href={getDashboardLink()}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname.includes("dashboard") || ["/provider", "/recipient", "/volunteer", "/admin"].includes(pathname)
                    ? "bg-freshBg text-freshText-primary font-bold"
                    : "text-freshText-secondary hover:text-freshText-primary"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Role Switcher for Hackathon Judges */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-freshBorder bg-white hover:bg-freshBg text-freshText-secondary"
              >
                <span>Role: <strong className="text-freshText-primary capitalize">{user?.role?.replace("_", " ") || "Guest"}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-freshText-secondary" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-freshBorder shadow-floating p-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 border-b border-freshBorder mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary">Demo Fast Role Switcher</p>
                  </div>
                  {rolesList.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchDemoRole(item.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        user?.role === item.role ? "bg-lime/20 text-[#4c5c0a] font-semibold" : "hover:bg-freshBg text-freshText-primary"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sage-100 text-freshText-secondary">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "food_provider" && (
                  <Link href="/donate">
                    <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                      Donate Food
                    </Button>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-full border border-freshBorder bg-white hover:bg-red-50 text-freshText-secondary hover:text-freshError transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="text-xs">
                    Join FoodLoop
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-2xl border border-freshBorder bg-white text-freshText-primary"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-freshBorder bg-white px-4 pt-3 pb-5 space-y-3 animate-fade-in">
          <div className="flex flex-col gap-1">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-xl hover:bg-freshBg flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-lime-600" />
              Explore Food
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-red-600" />
                <span>Event Rescue</span>
              </div>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-red-600 text-white">Weddings</span>
            </Link>
            <Link
              href="/recipients"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-xl hover:bg-freshBg flex items-center gap-2 text-amber-900"
            >
              <span>🐾</span>
              <span>Animal Care & Beneficiaries</span>
            </Link>
            <Link
              href="/donors"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-xl hover:bg-freshBg flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-600" />
              Donor Shops & Restaurants
            </Link>
            <Link
              href="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs font-semibold rounded-xl hover:bg-freshBg flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-freshSuccess" />
              Impact Metrics
            </Link>
            {user && (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl hover:bg-freshBg flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#3b82f6]" />
                Dashboard ({user.role})
              </Link>
            )}
          </div>

          {/* Mobile Role Switcher */}
          <div className="pt-2 border-t border-freshBorder">
            <p className="text-[10px] uppercase font-bold tracking-wider text-freshText-secondary mb-2">Fast Switch Demo Role:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchDemoRole(item.role);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border ${
                    user?.role === item.role ? "border-lime bg-lime/20 font-bold" : "border-freshBorder bg-freshBg"
                  }`}
                >
                  {item.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-freshBorder flex flex-col gap-2">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-xs text-freshError"
              >
                Sign Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                    Join FoodLoop
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
