import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export default function PageHeader({
  badge,
  title,
  description,
  actions,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-[var(--ifms-green-100)] bg-white px-5 py-5 shadow-[var(--ifms-shadow-soft)] md:px-6 md:py-6",
        className,
      )}
    >
      <div className="max-w-4xl space-y-2">
        {badge && (
          <Badge className="rounded-full bg-[var(--ifms-green-50)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--ifms-green-800)] hover:bg-[var(--ifms-green-50)]">
            {badge}
          </Badge>
        )}
        <h1 className={cn("text-2xl font-bold tracking-tight text-[var(--ifms-green-900)] md:text-3xl", titleClassName)}>
          {title}
        </h1>
        {description ? <p className="text-sm leading-7 text-[var(--ifms-text-soft)] md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
