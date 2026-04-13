import { cn } from "@/lib/utils";
import { ElementType } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ElementType;
  color?: string;
  bg?: string;
  className?: string;
  onClick?: () => void;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "#29b6d4",
  bg = "rgba(41,182,212,0.12)",
  className,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn("rounded-xl p-4 transition-all", onClick && "cursor-pointer hover:scale-[1.02]", className)}
      style={{
        background: "linear-gradient(135deg, rgba(19,19,42,0.97) 0%, rgba(26,26,53,0.97) 100%)",
        border: "1px solid rgba(107,95,160,0.25)",
        boxShadow: "0 4px 16px rgba(74,63,122,0.2)",
      }}
      onClick={onClick}
    >
      {Icon && (
        <div
          className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: bg, boxShadow: `0 0 10px ${color}44` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      )}
      <p
        className="text-2xl font-bold"
        style={{ color: "#e8e6f0", fontFamily: "'Rajdhani', sans-serif" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: "#9e9ab8" }}>{label}</p>
    </div>
  );
}
