import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function Card({
  children,
  className = "",
  hoverEffect = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl border border-freshBorder p-6 transition-all duration-200 ${
        hoverEffect ? "hover:border-lime-500/50 hover:shadow-card cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
