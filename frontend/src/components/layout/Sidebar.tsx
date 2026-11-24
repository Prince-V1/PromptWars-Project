"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PlusCircle, Compass,
  Truck, ShieldCheck, BarChart3, LogOut, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case "food_provider":
        return [
          { href: "/provider", label: "Provider Dashboard", icon: LayoutDashboard },
          { href: "/donate", label: "Create Donation", icon: PlusCircle },
          { href: "/discover", label: "Public Listings", icon: Compass },
          { href: "/impact", label: "Impact Analytics", icon: BarChart3 },
        ];
      case "recipient":
        return [
          { href: "/recipient", label: "NGO Dashboard", icon: LayoutDashboard },
          { href: "/discover", label: "Explore Food", icon: Compass },
          { href: "/impact", label: "Impact Analytics", icon: BarChart3 },
        ];
      case "volunteer":
        return [
          { href: "/volunteer", label: "Volunteer Tasks", icon: Truck },
          { href: "/discover", label: "Explore Food", icon: Compass },
          { href: "/impact", label: "Impact Analytics", icon: BarChart3 },
        ];
      case "admin":
        return [
          { href: "/admin", label: "Admin Console", icon: ShieldCheck },
          { href: "/discover", label: "All Listings", icon: Compass },
          { href: "/impact", label: "Global Impact", icon: BarChart3 },
        ];
      default:
        return [
          { href: "/discover", label: "Explore Food", icon: Compass },
          { href: "/impact", label: "Impact", icon: BarChart3 },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-freshBorder min-h-[calc(100vh-5rem)] p-6 hidden md:flex flex-col justify-between shrink-0">
      <div>
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-freshBg border border-freshBorder mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-lime text-freshText-primary font-bold flex items-center justify-center text-sm shadow-sm">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-freshText-primary truncate">{user.full_name}</h4>
              <p className="text-[11px] text-freshText-secondary truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-freshBorder text-[10px]">
            <span className="font-bold uppercase tracking-wider text-freshText-secondary">
              {user.role.replace("_", " ")}
            </span>
            <span className="flex items-center gap-1 text-freshSuccess font-bold">
              <CheckCircle2 className="w-3 h-3 text-freshSuccess" />
              Verified
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-lime text-freshText-primary shadow-sm"
                    : "text-freshText-secondary hover:text-freshText-primary hover:bg-freshBg"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-freshText-primary" : "text-freshText-secondary"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-freshError hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors w-full"
      >
        <LogOut className="w-4 h-4 text-freshError" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
