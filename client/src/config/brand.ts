export const brandAssets = {
  logoHorizontal: "/brand/ifms-logo-horizontal.svg",
  logoVertical: "/brand/ifms-logo-vertical.svg",
  icon: "/brand/ifms-icon.svg",
} as const;

export const brandInstitution = {
  name: "Instituto Federal de Mato Grosso do Sul",
  shortName: "IFMS",
  product: "PPC Digital",
  fallbackTypography: "Open Sans, Arial, sans-serif",
} as const;

export const brandRules = {
  minLogoWidthPx: 30,
  safeAreaUnitX: 1,
} as const;

export type BrandLogoVariant = "horizontal" | "vertical" | "icon";

export function getBrandAssetByVariant(variant: BrandLogoVariant): string {
  if (variant === "vertical") return brandAssets.logoVertical;
  if (variant === "icon") return brandAssets.icon;
  return brandAssets.logoHorizontal;
}
