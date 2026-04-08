import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import {
  brandInstitution,
  getBrandAssetByVariant,
  type BrandLogoVariant,
} from "@/config/brand";

type BrandMarkProps = {
  variant?: BrandLogoVariant;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  alt?: string;
};

export default function BrandMark({
  variant = "horizontal",
  className,
  imgClassName,
  fallbackClassName,
  alt,
}: BrandMarkProps) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => getBrandAssetByVariant(variant), [variant]);

  if (failed) {
    const isVertical = variant === "vertical";

    return (
      <div
        className={cn(
          "inline-flex items-center rounded-xl border border-[var(--ifms-green-100)] bg-white text-[var(--ifms-green-900)] shadow-[var(--ifms-shadow-soft)]",
          isVertical ? "flex-col gap-2 px-4 py-4 text-center" : "gap-2 px-3 py-2.5",
          fallbackClassName,
          className,
        )}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ifms-green-600)] text-white">
          <GraduationCap className="h-4 w-4" />
        </span>
        <span className={cn("min-w-0", isVertical ? "space-y-1" : "space-y-0.5")}>
          <span className="block truncate text-sm font-bold tracking-tight">{brandInstitution.product}</span>
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ifms-green-700)]">
            {brandInstitution.shortName}
          </span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? `${brandInstitution.shortName} logo`}
      className={cn("h-auto max-w-full object-contain", imgClassName, className)}
      onError={() => setFailed(true)}
      loading="eager"
      decoding="async"
    />
  );
}
