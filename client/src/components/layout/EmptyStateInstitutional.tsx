import React from "react";
import { cn } from "@/lib/utils";
import { InboxIcon } from "lucide-react";
import { ReactNode } from "react";

type EmptyStateInstitutionalProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
};

export default function EmptyStateInstitutional({
  title,
  description,
  icon,
  className,
}: EmptyStateInstitutionalProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--ifms-green-200)] bg-[var(--ifms-green-50)] px-4 py-12 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ifms-green-100)] bg-white text-[var(--ifms-green-700)]">
        {icon ?? <InboxIcon className="h-5 w-5" />}
      </div>
      <p className="text-sm font-semibold text-[var(--ifms-green-900)]">{title}</p>
      <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--ifms-text-soft)]">{description}</p>
    </div>
  );
}
