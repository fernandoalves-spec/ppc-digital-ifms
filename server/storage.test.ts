/**
 * Testes de segurança para server/storage.ts
 * Foco: prevenção de path traversal na função sanitizeLocalKey (modo local).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import os from "os";

// ─── Helpers para testar a função interna sanitizeLocalKey ─────────────────
// Como sanitizeLocalKey não é exportada, testamos via storagePut/storageGet
// com mocks de fs e env para forçar o modo local.

// Mock do módulo ENV para desativar o Manus Storage Proxy
vi.mock("./_core/env", () => ({
  ENV: {
    forgeApiUrl: null,
    forgeApiKey: null,
    ownerOpenId: "test-owner",
    ownerEmail: null,
  },
}));

// Mock do fs para evitar escrita real em disco durante os testes
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

describe("storage.ts — sanitização de path traversal (modo local)", () => {
  const BASE_DIR = path.join(os.tmpdir(), "ppc-test-uploads");

  beforeEach(() => {
    // Força o modo local apontando LOCAL_UPLOADS_DIR para um diretório temporário
    process.env.LOCAL_UPLOADS_DIR = BASE_DIR;
    // Remove BUILT_IN_FORGE_API_URL para garantir modo local
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.BUILT_IN_FORGE_API_KEY;
  });

  afterEach(() => {
    delete process.env.LOCAL_UPLOADS_DIR;
    vi.clearAllMocks();
  });

  it("deve aceitar uma chave de arquivo válida", async () => {
    // Reimportar para pegar o env atualizado
    const { storagePut } = await import("./storage");
    const result = await storagePut("ppc-documents/arquivo.pdf", Buffer.from("test"), "application/pdf");
    expect(result.key).toBe("ppc-documents/arquivo.pdf");
    expect(result.url).toContain("/uploads/ppc-documents/arquivo.pdf");
  });

  it("deve rejeitar chave com segmento '..' (path traversal clássico)", async () => {
    const { storagePut } = await import("./storage");
    await expect(
      storagePut("../../etc/passwd", Buffer.from("malicious"), "text/plain")
    ).rejects.toThrow(/path traversal/i);
  });

  it("deve rejeitar chave com '..' embutido no meio do caminho", async () => {
    const { storagePut } = await import("./storage");
    await expect(
      storagePut("uploads/../../../etc/shadow", Buffer.from("malicious"), "text/plain")
    ).rejects.toThrow(/path traversal/i);
  });

  it("deve rejeitar chave com byte nulo", async () => {
    const { storagePut } = await import("./storage");
    await expect(
      storagePut("arquivo\0.pdf", Buffer.from("test"), "application/pdf")
    ).rejects.toThrow(/null byte/i);
  });

  it("deve remover barras iniciais de chave válida", async () => {
    const { storagePut } = await import("./storage");
    const result = await storagePut("/ppc-documents/arquivo.pdf", Buffer.from("test"), "application/pdf");
    expect(result.key).toBe("ppc-documents/arquivo.pdf");
  });

  it("storageGet também deve rejeitar path traversal", async () => {
    const { storageGet } = await import("./storage");
    await expect(
      storageGet("../../etc/passwd")
    ).rejects.toThrow(/path traversal/i);
  });

  it("storageGet deve retornar URL válida para chave segura", async () => {
    const { storageGet } = await import("./storage");
    const result = await storageGet("reports/relatorio.pdf");
    expect(result.key).toBe("reports/relatorio.pdf");
    expect(result.url).toContain("/uploads/reports/relatorio.pdf");
  });
});
