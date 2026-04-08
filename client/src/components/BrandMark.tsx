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
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-[var(--ifms-green-100)] bg-white px-3 py-2 text-[var(--ifms-green-900)]",
          fallbackClassName,
          className,
        )}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ifms-green-600)] text-white">
          <GraduationCap className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          {brandInstitution.product} {brandInstitution.shortName}
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
