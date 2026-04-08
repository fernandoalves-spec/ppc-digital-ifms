import React from "react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--ifms-green-100)] bg-white p-4 shadow-[var(--ifms-shadow-soft)] md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
