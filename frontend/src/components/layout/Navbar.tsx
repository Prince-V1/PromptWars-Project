"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, PlusCircle, Compass, 
  BarChart3, ShieldCheck, ChevronDown, LogOut,
  MapPin, Store, CalendarCheck, Truck, User,
  Bell, CheckCheck, ShoppingBag
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "order" | "feed" | "receipt" | "delivery";
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New Claim Request",
    message: "Robin Hood Army requested 20 kg Subz Dum Biryani (Hauz Khas Hub)",
    time: "2m ago",
    read: false,
    type: "order",
    link: "/orders/req-hk-01",
  },
  {
    id: "notif-2",
    title: "Animal Feed Reserved",
    message: "Stray Relief Shelter reserved 45 kg Whole Wheat Roti Mash",
    time: "15m ago",
    read: false,
    type: "feed",
    link: "/orders/req-hk-02",
  },
  {
    id: "notif-3",
    title: "Handover Receipt Ready",
    message: "Verified FSSAI Handover Manifest #FL-HK-01 generated",
    time: "1h ago",
    read: false,
    type: "receipt",
    link: "/orders/req-hk-03/receipt",
  },
  {
    id: "notif-4",
    title: "Order Delivered",
    message: "Shahi Paneer safely delivered to Asha Sadan Delhi",
    time: "2h ago",
    read: true,
    type: "delivery",
    link: "/orders",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { currentLocation, openModal: openLocationModal } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Load persisted notifications
  useEffect(() => {
    try {
      const saved = localStorage.getItem("foodloop_notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem("foodloop_notifications", JSON.stringify(items));
    } catch {}
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  return (
    <header className="sticky top-0 z-40 bg-freshBg/80 backdrop-blur-md border-b border-freshBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <img
              src="/images/logo.png"
              alt="FoodLoop Logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/food/dal_makhani.jpg";
              }}
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
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-emerald-700"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explore Food</span>
            </Link>

            <Link
              href="/my-shop"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/my-shop")
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-emerald-700"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
              <span>My E-Shop</span>
            </Link>

            <Link
              href="/events"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/events")
                  ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-rose-600"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>Event Rescue</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-rose-600 text-white">Weddings</span>
            </Link>

            <Link
              href="/recipients"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/recipients")
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-indigo-600"
              }`}
            >
              <span>🐾</span>
              <span>Animal Care & Feed</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-indigo-600 text-white">Gaushalas</span>
            </Link>

            <Link
              href="/donors"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname === "/donors"
                  ? "bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-amber-700"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Donor Directory</span>
            </Link>

            <Link
              href="/orders"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/orders")
                  ? "bg-teal-50 text-teal-800 border border-teal-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-teal-700"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-600" />
              <span>Track Orders</span>
            </Link>

            <Link
              href="/impact"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                pathname === "/impact"
                  ? "bg-green-50 text-green-800 border border-green-200 font-bold shadow-xs"
                  : "text-freshText-secondary hover:text-green-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-freshSuccess" />
              <span>Impact</span>
            </Link>

            {user && (
              <Link
                href={getDashboardLink()}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                  pathname.includes("dashboard") || ["/provider", "/recipient", "/volunteer", "/admin"].includes(pathname)
                    ? "bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs"
                    : "text-freshText-secondary hover:text-blue-700"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Live Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-full border border-freshBorder bg-white hover:bg-emerald-50 transition-all text-freshText-primary shadow-xs"
                title="Notifications & Order Updates"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 text-emerald-800" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-freshBorder shadow-floating p-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-freshBorder px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-freshText-primary">
                        Live Updates
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-2 py-0.2 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        href={item.link || "/orders"}
                        onClick={() => {
                          markAsRead(item.id);
                          setNotificationsOpen(false);
                        }}
                        className={`block p-2.5 rounded-2xl transition-all border ${
                          item.read
                            ? "bg-freshBg/50 border-freshBorder text-freshText-secondary"
                            : "bg-emerald-50/70 border-emerald-200 text-freshText-primary font-medium"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {item.type === "feed" && <span>🐾</span>}
                            {item.type === "order" && <span>📦</span>}
                            {item.type === "receipt" && <span>📄</span>}
                            {item.type === "delivery" && <span>✅</span>}
                            <span className="text-xs font-bold text-freshText-primary">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-freshText-secondary shrink-0">{item.time}</span>
                        </div>
                        <p className="text-xs text-freshText-secondary mt-1 leading-snug">{item.message}</p>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-freshBorder">
                    <Link
                      href="/orders"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1"
                    >
                      View All Orders & Deliveries →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Button */}
            <Link href="/profile">
              <button
                className={`p-2.5 rounded-full border border-freshBorder bg-white hover:bg-freshBg transition-all text-freshText-primary shadow-xs ${
                  pathname === "/profile" ? "ring-2 ring-emerald-500 bg-emerald-50" : ""
                }`}
                title="Edit User & Organization Profile"
              >
                <User className="w-4 h-4 text-emerald-800" />
              </button>
            </Link>

            {/* Primary Donate CTA */}
            <Link href="/donate">
              <Button 
                variant="primary" 
                size="sm" 
                className="text-xs font-extrabold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4.5 py-2.5 flex items-center gap-1.5" 
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                + Donate Food
              </Button>
            </Link>

            {user && (
              <button
                onClick={logout}
                className="p-2.5 rounded-full border border-freshBorder bg-white hover:bg-red-50 text-freshText-secondary hover:text-freshError transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile notification toggle */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl border border-freshBorder bg-white text-emerald-800"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

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
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname === "/discover"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Explore Food</span>
            </Link>

            <Link
              href="/my-shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname.startsWith("/my-shop")
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>My E-Shop (Donor Storefront)</span>
            </Link>

            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                pathname.startsWith("/events")
                  ? "bg-rose-50 text-rose-700 font-bold border border-rose-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-rose-600" />
                <span>Event Rescue</span>
              </div>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">Weddings</span>
            </Link>

            <Link
              href="/recipients"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                pathname.startsWith("/recipients")
                  ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>🐾</span>
                <span>Animal Care & Feed</span>
              </div>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">Gaushalas</span>
            </Link>

            <Link
              href="/donors"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname === "/donors"
                  ? "bg-amber-50 text-amber-800 font-bold border border-amber-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <Store className="w-4 h-4 text-amber-600" />
              <span>Donor Directory</span>
            </Link>

            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname.startsWith("/orders")
                  ? "bg-teal-50 text-teal-800 font-bold border border-teal-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <Truck className="w-4 h-4 text-teal-600" />
              <span>Track Orders & Receipts</span>
            </Link>

            <Link
              href="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname === "/impact"
                  ? "bg-green-50 text-green-800 font-bold border border-green-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-freshSuccess" />
              <span>Impact Metrics</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                pathname === "/profile"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "hover:bg-freshBg text-freshText-secondary"
              }`}
            >
              <User className="w-4 h-4 text-emerald-700" />
              <span>User & Org Profile</span>
            </Link>

            {user && (
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors ${
                  pathname.includes("dashboard") || ["/provider", "/recipient", "/volunteer", "/admin"].includes(pathname)
                    ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                    : "hover:bg-freshBg text-freshText-secondary"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#3b82f6]" />
                <span>Dashboard ({user.role})</span>
              </Link>
            )}

            <div className="pt-2">
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-4 py-2.5 text-xs font-extrabold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>+ Donate Food</span>
              </Link>
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
