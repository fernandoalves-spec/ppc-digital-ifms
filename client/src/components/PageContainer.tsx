import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--ifms-border)] bg-white p-3 shadow-[var(--ifms-shadow-soft)] md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
