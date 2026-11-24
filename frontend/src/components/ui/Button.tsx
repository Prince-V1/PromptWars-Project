"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "indigo" | "rose" | "emerald" | "amber";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variantStyles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400 font-bold shadow-sm",
    secondary: "bg-sage-200 text-freshText-primary hover:bg-sage-300 focus:ring-sage-300 font-semibold",
    outline: "border border-freshBorder bg-white text-freshText-primary hover:bg-freshBg focus:ring-emerald-400 font-semibold",
    danger: "bg-freshError text-white hover:bg-red-700 focus:ring-red-400 font-bold",
    ghost: "bg-transparent text-freshText-secondary hover:text-freshText-primary hover:bg-black/5 focus:ring-emerald-400 font-medium",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm focus:ring-emerald-400",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm focus:ring-indigo-400",
    rose: "bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm focus:ring-rose-400",
    amber: "bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm focus:ring-amber-400",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
