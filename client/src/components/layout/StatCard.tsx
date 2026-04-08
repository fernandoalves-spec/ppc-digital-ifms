import React from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  tone?: "default" | "danger";
  className?: string;
};

export default function StatCard({
  label,
  value,
  tone = "default",
  className,
}: StatCardProps) {
  const toneClasses =
    tone === "danger"
      ? "border-[var(--ifms-red-100)] bg-[var(--ifms-red-50)] text-[var(--ifms-red-700)]"
      : "border-[var(--ifms-green-100)] bg-[var(--ifms-green-50)] text-[var(--ifms-green-900)]";

  return (
    <div className={cn("rounded-2xl border px-4 py-3", toneClasses, className)}>
      <p className="text-[11px] uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
