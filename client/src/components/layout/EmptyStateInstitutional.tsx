import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ElementType } from "react";

type EmptyStateProps = {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export default function EmptyStateInstitutional({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center rounded-xl px-6 py-12 text-center", className)}
      style={{
        background: "rgba(19,19,42,0.5)",
        border: "1px dashed rgba(107,95,160,0.3)",
      }}
    >
      {Icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(107,95,160,0.12)",
            border: "1px solid rgba(107,95,160,0.25)",
            boxShadow: "0 0 16px rgba(107,95,160,0.15)",
          }}
        >
          <Icon className="h-7 w-7" style={{ color: "#6b5fa0" }} />
        </div>
      )}
      <p
        className="text-base font-semibold"
        style={{ fontFamily: "'Rajdhani', sans-serif", color: "#e8e6f0", letterSpacing: "0.03em" }}
      >
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm" style={{ color: "#9e9ab8" }}>
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
          style={{
            background: "rgba(107,95,160,0.12)",
            border: "1px solid rgba(107,95,160,0.35)",
            color: "#8b7ec0",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
