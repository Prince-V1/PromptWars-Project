import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "lime" | "sage" | "success" | "warning" | "error" | "neutral" | "indigo" | "rose" | "amber" | "teal" | "blue" | "primary";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  icon,
}: BadgeProps) {
  const variantStyles = {
    lime: "bg-lime/20 text-[#55690b] border border-lime/30 font-medium",
    sage: "bg-sage-100 text-freshText-secondary border border-sage-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
    error: "bg-red-50 text-red-700 border border-red-200 font-semibold",
    neutral: "bg-white text-freshText-secondary border border-freshBorder",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold",
    rose: "bg-rose-50 text-rose-700 border border-rose-200 font-bold",
    amber: "bg-amber-50 text-amber-800 border border-amber-200 font-bold",
    teal: "bg-teal-50 text-teal-800 border border-teal-200 font-bold",
    blue: "bg-blue-50 text-blue-700 border border-blue-200 font-bold",
    primary: "bg-emerald-600 text-white font-bold shadow-xs",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
