export const ifmsColorTokens = {
  green: {
    hex: "#32A041",
    rgb: { r: 50, g: 160, b: 65 },
    cmyk: { c: 75, m: 0, y: 100, k: 15 },
    pantone: "362 C",
  },
  red: {
    hex: "#C8191E",
    rgb: { r: 200, g: 25, b: 30 },
    cmyk: { c: 0, m: 100, y: 100, k: 15 },
    pantone: "187 C",
  },
  black: {
    hex: "#000000",
    cmyk: { c: 0, m: 0, y: 0, k: 100 },
    pantone: "Process Black C",
  },
} as const;

export const ifmsTypographyTokens = {
  primaryFamily: "Open Sans",
  fallbacks: ["Arial", "sans-serif"],
  allowedWeights: [300, 400, 500, 600, 700, 800] as const,
} as const;

export enum IfmsBrandVariant {
  OfficialColor = "official-color",
  MonochromaticPositive = "monochromatic-positive",
  MonochromaticNegative = "monochromatic-negative",
  Grayscale = "grayscale",
  RestrictedGreenMonochromatic = "restricted-green-monochromatic",
}

export const ifmsScreenPalette = {
  primary: ifmsColorTokens.green.hex,
  danger: ifmsColorTokens.red.hex,
  textPrimary: ifmsColorTokens.black.hex,
} as const;

export const ifmsExportPalette = {
  headerBackground: ifmsColorTokens.green.hex,
  accent: ifmsColorTokens.red.hex,
  text: ifmsColorTokens.black.hex,
} as const;
