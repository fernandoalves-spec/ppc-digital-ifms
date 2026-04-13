import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ badge, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        {badge && (
          <span
            className="inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(107,95,160,0.15)",
              color: "#8b7ec0",
              border: "1px solid rgba(107,95,160,0.3)",
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            ⚡ {badge}
          </span>
        )}
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Cinzel', serif", color: "#e8e6f0", letterSpacing: "0.04em" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm" style={{ color: "#9e9ab8", fontFamily: "'Rajdhani', sans-serif" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
