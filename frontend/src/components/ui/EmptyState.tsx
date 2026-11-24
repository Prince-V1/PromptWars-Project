import React from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-freshBorder">
      <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-center text-freshText-secondary mb-4">
        {icon || <PackageOpen className="w-8 h-8 text-sage-400" />}
      </div>
      <h3 className="text-lg font-semibold text-freshText-primary mb-1">{title}</h3>
      <p className="text-sm text-freshText-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
