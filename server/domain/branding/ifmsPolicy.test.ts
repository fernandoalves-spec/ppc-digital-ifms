import { describe, expect, it } from "vitest";
import { validateBrandPolicyIfms } from "./ifmsPolicy";

const validPayload = {
  medium: "digital" as const,
  integrityAreaX: 1,
  widthPx: 64,
  typography: "Open Sans",
  orientation: "horizontal" as const,
  lockup: "symbol-left-text-right" as const,
  backgroundComplex: false,
  hasWhiteBase: false,
  hasDistortion: false,
  hasColorChange: false,
  hasOutline: false,
  hasFrame: false,
  hasReorganization: false,
};

describe("validateBrandPolicyIfms", () => {
  it("aceita aplicação válida", () => {
    const result = validateBrandPolicyIfms(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("retorna mensagem simples quando está abaixo de 30px no digital", () => {
    const result = validateBrandPolicyIfms({ ...validPayload, widthPx: 20 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message === "A marca está abaixo de 30 px no digital.")).toBe(true);
  });

  it("bloqueia combinação não permitida de orientação e lockup", () => {
    const result = validateBrandPolicyIfms({
      ...validPayload,
      orientation: "vertical",
      lockup: "symbol-left-text-right",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "ORIENTATION_LOCKUP_NOT_ALLOWED")).toBe(true);
  });

  it("exige base branca em fundo complexo", () => {
    const result = validateBrandPolicyIfms({
      ...validPayload,
      backgroundComplex: true,
      hasWhiteBase: false,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "WHITE_BASE_REQUIRED")).toBe(true);
  });
});
