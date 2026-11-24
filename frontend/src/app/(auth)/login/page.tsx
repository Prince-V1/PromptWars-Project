"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      router.push("/discover");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts: { role: UserRole; title: string; email: string; desc: string }[] = [
    { role: "food_provider", title: "Food Provider", email: "taj.delhi@foodloop.in", desc: "Taj Palace Banquets" },
    { role: "recipient", title: "NGO Recipient", email: "robinhood.delhi@foodloop.in", desc: "Robin Hood Army Delhi" },
    { role: "volunteer", title: "Volunteer Courier", email: "arjun.volunteer@foodloop.in", desc: "Arjun Verma" },
    { role: "admin", title: "Administrator", email: "admin@foodloop.in", desc: "Dr. Sunita Sharma" },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white border border-freshBorder flex items-center justify-center p-2 mx-auto shadow-sm">
          <img src="/images/logo.png" alt="FoodLoop" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-freshText-primary tracking-tight">
          Welcome to FoodLoop
        </h1>
        <p className="text-xs text-freshText-secondary">
          Sign in to coordinate surplus food redistribution.
        </p>
      </div>

      <Card className="p-8 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-freshError flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-freshText-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-10 pr-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-freshText-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-bold shadow-floating mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-freshText-secondary">
            Don't have an account yet?{" "}
            <Link href="/register" className="font-bold text-lime-700 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </Card>

      {/* One-Click Hackathon Evaluator Fast-Logins */}
      <div className="p-5 rounded-3xl bg-white border border-freshBorder shadow-subtle space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-freshText-primary">
          <Sparkles className="w-4 h-4 text-lime-600" />
          <span>Hackathon Demo Fast-Logins</span>
        </div>
        <p className="text-[11px] text-freshText-secondary">
          Click below to immediately authenticate into any of the 4 role workflows:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              onClick={async () => {
                await switchDemoRole(acc.role);
                router.push(
                  acc.role === "food_provider" ? "/provider" :
                  acc.role === "recipient" ? "/recipient" :
                  acc.role === "volunteer" ? "/volunteer" : "/admin"
                );
              }}
              className="p-2.5 rounded-2xl bg-freshBg border border-freshBorder hover:border-lime-500 text-left transition-all group"
            >
              <p className="text-xs font-bold text-freshText-primary group-hover:text-lime-700">{acc.title}</p>
              <p className="text-[10px] text-freshText-secondary truncate">{acc.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
