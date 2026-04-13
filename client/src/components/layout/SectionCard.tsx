import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
  return (
    <div
      className={cn("rounded-xl", className)}
      style={{
        background: "linear-gradient(135deg, rgba(19,19,42,0.97) 0%, rgba(26,26,53,0.97) 100%)",
        border: "1px solid rgba(107,95,160,0.25)",
        boxShadow: "0 4px 20px rgba(74,63,122,0.2)",
      }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(107,95,160,0.2)" }}
        >
          <div>
            {title && (
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0", letterSpacing: "0.03em" }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm" style={{ color: "#9e9ab8" }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
