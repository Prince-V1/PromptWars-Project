"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "@/types";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial local token or Supabase session
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const savedToken = session?.access_token || localStorage.getItem("foodloop_token");
        if (savedToken) {
          setToken(savedToken);
          localStorage.setItem("foodloop_token", savedToken);
          const profile = await api.getMe();
          setUser(profile);
        }
      } catch {
        localStorage.removeItem("foodloop_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Supabase Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        localStorage.setItem("foodloop_token", session.access_token);
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch {
          // Profile handled
        }
      } else if (!localStorage.getItem("foodloop_token")) {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // First attempt Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (!error && data?.session?.access_token) {
          localStorage.setItem("foodloop_token", data.session.access_token);
          setToken(data.session.access_token);
          const profile = await api.getMe();
          setUser(profile);
          return;
        }
      } catch {
        // Fallback to backend API
      }

      // Backend API login
      const res = await api.login(email, pass);
      localStorage.setItem("foodloop_token", res.access_token);
      setToken(res.access_token);
      const profile = await api.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      // Create account via API
      const res = await api.register(payload);
      localStorage.setItem("foodloop_token", res.access_token);
      setToken(res.access_token);
      const profile = await api.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Supabase logout handled
    }
    localStorage.removeItem("foodloop_token");
    setToken(null);
    setUser(null);
  };

  // One-click role switcher for hackathon judges & demonstrations
  const switchDemoRole = async (role: UserRole) => {
    const demoAccounts: Record<UserRole, { email: string; pass: string }> = {
      food_provider: { email: "taj.delhi@foodloop.in", pass: "Provider@1234" },
      recipient: { email: "robinhood.delhi@foodloop.in", pass: "Recipient@1234" },
      volunteer: { email: "arjun.volunteer@foodloop.in", pass: "Volunteer@1234" },
      admin: { email: "admin@foodloop.in", pass: "Admin@FoodLoop2026" },
    };

    const target = demoAccounts[role];
    if (target) {
      await login(target.email, target.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
