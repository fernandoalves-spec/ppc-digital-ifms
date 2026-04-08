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
    <div className={cn("flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center", className)}>
      {Icon && <Icon className="mb-3 h-12 w-12 text-slate-300" />}
      <p className="font-medium text-slate-500">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      {action && (
        <Button variant="outline" className="mt-4" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
