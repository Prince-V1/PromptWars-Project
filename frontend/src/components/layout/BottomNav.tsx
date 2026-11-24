"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, PlusCircle, BarChart3, LayoutDashboard, Store, CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const getDashboardHref = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "food_provider": return "/provider";
      case "recipient": return "/recipient";
      case "volunteer": return "/volunteer";
      case "admin": return "/admin";
      default: return "/discover";
    }
  };

  const navItems = [
    { href: "/discover", label: "Explore", icon: Compass },
    { href: "/events", label: "Events", icon: CalendarCheck },
    { href: "/donate", label: "Donate", icon: PlusCircle, isPrimary: true },
    { href: "/donors", label: "Directory", icon: Store },
    { href: getDashboardHref(), label: user ? "Dashboard" : "Account", icon: LayoutDashboard },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-freshBorder px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-lime text-freshText-primary flex items-center justify-center shadow-floating border-2 border-white active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-freshText-primary" />
                </div>
                <span className="text-[10px] font-bold text-freshText-primary mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 transition-colors ${
                isActive ? "text-freshText-primary font-bold" : "text-freshText-secondary"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-freshText-primary" : "text-freshText-secondary"}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
