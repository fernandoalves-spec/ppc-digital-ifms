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

export default function StatCard({ label, value, icon: Icon, color = "text-green-600", bg = "bg-green-50", className, onClick }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", onClick && "cursor-pointer hover:shadow-md transition-all", className)} onClick={onClick}>
      {Icon && (
        <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      )}
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
