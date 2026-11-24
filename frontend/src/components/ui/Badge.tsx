import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "lime" | "sage" | "success" | "warning" | "error" | "neutral";
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
    success: "bg-[#258A54]/10 text-freshSuccess border border-freshSuccess/20 font-medium",
    warning: "bg-[#D69A30]/10 text-freshWarning border border-freshWarning/20 font-medium",
    error: "bg-[#D94B45]/10 text-freshError border border-freshError/20 font-medium",
    neutral: "bg-white text-freshText-secondary border border-freshBorder",
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
