import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-freshBorder mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/images/logo.png" alt="FoodLoop" className="h-9 w-auto object-contain" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-freshText-primary block leading-none">FoodLoop</span>
                <span className="text-[10px] font-bold text-red-600 block mt-0.5">Save • Share • Feed</span>
              </div>
            </div>
            <p className="text-sm text-freshText-secondary leading-relaxed">
              Save Food • Share Food • Feed Better. Connecting restaurants, bakeries, hotels, and grocery stores with verified non-profits across Delhi NCR.
            </p>
            <div className="flex items-center gap-2 text-xs text-freshText-secondary pt-2">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>India • Delhi NCR</span>
              <span className="text-freshBorder">•</span>
              <Clock className="w-3.5 h-3.5 text-freshText-secondary" />
              <span>Asia/Kolkata (IST)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-freshText-primary mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-freshText-secondary">
              <li><Link href="/discover" className="hover:text-freshText-primary transition-colors">Discover Food</Link></li>
              <li><Link href="/donors" className="hover:text-freshText-primary transition-colors font-semibold text-red-600">Donor Shops</Link></li>
              <li><Link href="/donate" className="hover:text-freshText-primary transition-colors">Donate Food</Link></li>
              <li><Link href="/impact" className="hover:text-freshText-primary transition-colors">Impact Analytics</Link></li>
              <li><Link href="/login" className="hover:text-freshText-primary transition-colors">Sign In / Dashboard</Link></li>
            </ul>
          </div>

          {/* Compliance & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-freshText-primary mb-4">Verification & Safety</h4>
            <ul className="space-y-2.5 text-sm text-freshText-secondary">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-freshSuccess" />
                <span>FSSAI Partner Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-freshSuccess" />
                <span>NGO DARPAN / 80G Certified</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-freshSuccess" />
                <span>Cold-Chain & Food Hygiene</span>
              </li>
            </ul>
          </div>

          {/* Formula & Transparency */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-freshText-primary mb-4">Impact Methodology</h4>
            <p className="text-xs text-freshText-secondary leading-relaxed mb-3">
              Impact calculation standard: <strong>400g per meal</strong> (2.5 meals / kg) and <strong>2.5 kg CO2e</strong> avoided per kg food rescued (UNEP / WRAP index).
            </p>
            <div className="p-3 bg-sage-50 rounded-2xl border border-sage-200 text-xs text-freshText-secondary">
              Currency standard: <strong>INR (₹)</strong>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-freshBorder flex flex-col sm:flex-row items-center justify-between text-xs text-freshText-secondary gap-4">
          <p>© {new Date().getFullYear()} FoodLoop Platform. Save Food • Share Food • Feed Better.</p>
          <div className="flex items-center gap-1 text-freshText-secondary">
            <span>Built with care for zero food waste</span>
            <Heart className="w-3.5 h-3.5 text-freshError inline fill-current ml-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
