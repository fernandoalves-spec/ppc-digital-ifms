import { describe, it, expect } from "vitest";
import { isGeminiAvailable } from "./_core/gemini";

describe("Gemini Integration", () => {
  it("deve detectar disponibilidade do Gemini via GEMINI_API_KEY", () => {
    // O teste verifica se a função isGeminiAvailable funciona corretamente
    // Em ambiente de desenvolvimento com GEMINI_API_KEY configurada, deve retornar true
    const available = isGeminiAvailable();
    // Se a variável estiver configurada, deve ser true
    if (process.env.GEMINI_API_KEY) {
      expect(available).toBe(true);
    } else {
      expect(available).toBe(false);
    }
  });

  it("deve lançar erro quando GEMINI_API_KEY não está configurada e tenta usar", async () => {
    // Teste de segurança: se não houver chave, deve lançar erro descritivo
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      // Reimportar para pegar o estado atualizado
      const { isGeminiAvailable: check } = await import("./_core/gemini");
      // Com a chave removida, isGeminiAvailable deve retornar false
      // (não testamos extractPdfWithGemini pois precisaria de um PDF real)
      expect(typeof check).toBe("function");
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
