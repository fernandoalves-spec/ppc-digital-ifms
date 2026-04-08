export type IfmsBrandMedium = "digital" | "print";
export type IfmsBrandOrientation = "horizontal" | "vertical";
export type IfmsBrandLockup =
  | "symbol-left-text-right"
  | "symbol-top-text-bottom";

export interface IfmsBrandValidationInput {
  medium: IfmsBrandMedium;
  integrityAreaX: number;
  widthPx?: number;
  widthCm?: number;
  typography: string;
  orientation: IfmsBrandOrientation;
  lockup: IfmsBrandLockup;
  backgroundComplex: boolean;
  hasWhiteBase: boolean;
  hasDistortion: boolean;
  hasColorChange: boolean;
  hasOutline: boolean;
  hasFrame: boolean;
  hasReorganization: boolean;
}

export interface IfmsBrandValidationError {
  code: string;
  message: string;
}

export interface IfmsBrandValidationResult {
  valid: boolean;
  errors: IfmsBrandValidationError[];
}

const allowedLockupsByOrientation: Record<
  IfmsBrandOrientation,
  Set<IfmsBrandLockup>
> = {
  horizontal: new Set(["symbol-left-text-right"]),
  vertical: new Set(["symbol-top-text-bottom"]),
};

export const brandPolicyIfms = {
  integrityAreaMinX: 1,
  minDigitalWidthPx: 30,
  minPrintWidthCm: 1,
  requiredTypography: "Open Sans",
  forbiddenChanges: {
    distortion: true,
    colorChange: true,
    outline: true,
    frame: true,
    reorganization: true,
  },
  allowedLockupsByOrientation,
} as const;

export function validateIfmsBrandPolicy(
  input: IfmsBrandValidationInput,
): IfmsBrandValidationResult {
  const errors: IfmsBrandValidationError[] = [];

  if (input.integrityAreaX < brandPolicyIfms.integrityAreaMinX) {
    errors.push({
      code: "INTEGRITY_AREA_BELOW_MIN",
      message: "A área de integridade da marca deve ser de pelo menos 1x.",
    });
  }

  if (input.medium === "digital") {
    if ((input.widthPx ?? 0) < brandPolicyIfms.minDigitalWidthPx) {
      errors.push({
        code: "MIN_REDUCTION_DIGITAL",
        message: "A marca está abaixo de 30 px no digital.",
      });
    }
  }

  if (input.medium === "print") {
    if ((input.widthCm ?? 0) < brandPolicyIfms.minPrintWidthCm) {
      errors.push({
        code: "MIN_REDUCTION_PRINT",
        message: "A marca está abaixo de 1 cm no impresso.",
      });
    }
  }

  if (input.typography.trim().toLowerCase() !== "open sans") {
    errors.push({
      code: "TYPOGRAPHY_REQUIRED",
      message: "A tipografia obrigatória da marca é Open Sans.",
    });
  }

  const allowedLockups =
    brandPolicyIfms.allowedLockupsByOrientation[input.orientation];
  if (!allowedLockups.has(input.lockup)) {
    errors.push({
      code: "ORIENTATION_LOCKUP_NOT_ALLOWED",
      message:
        "Essa combinação de orientação da marca não é permitida para o padrão IFMS.",
    });
  }

  if (input.backgroundComplex && !input.hasWhiteBase) {
    errors.push({
      code: "WHITE_BASE_REQUIRED",
      message: "Em fundo complexo ou instável, a marca deve usar base branca.",
    });
  }

  if (input.hasDistortion) {
    errors.push({
      code: "DISTORTION_FORBIDDEN",
      message: "A marca não pode ser distorcida.",
    });
  }

  if (input.hasColorChange) {
    errors.push({
      code: "COLOR_CHANGE_FORBIDDEN",
      message: "A marca não pode ter as cores alteradas.",
    });
  }

  if (input.hasOutline) {
    errors.push({
      code: "OUTLINE_FORBIDDEN",
      message: "A marca não pode receber contorno (outline).",
    });
  }

  if (input.hasFrame) {
    errors.push({
      code: "FRAME_FORBIDDEN",
      message: "A marca não pode ser aplicada com moldura.",
    });
  }

  if (input.hasReorganization) {
    errors.push({
      code: "REORGANIZATION_FORBIDDEN",
      message: "Os elementos da marca não podem ser reorganizados.",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
