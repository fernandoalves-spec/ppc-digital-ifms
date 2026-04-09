// Storage helpers — suporta dois modos:
// 1. Manus Storage Proxy (quando BUILT_IN_FORGE_API_URL e BUILT_IN_FORGE_API_KEY estão configurados)
// 2. Modo local/Railway: salva em disco e serve via /uploads/ no servidor Express

import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';

// Diretório para armazenamento local (usado quando não há storage externo)
const LOCAL_UPLOADS_DIR = process.env.LOCAL_UPLOADS_DIR || path.join(process.cwd(), "uploads");

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

/** Remove barras iniciais — usado apenas para chamadas ao Manus Storage Proxy (não para filesystem local). */
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Sanitiza e valida uma chave de arquivo para uso no sistema de arquivos local.
 *
 * Segurança:
 *  - Rejeita explicitamente qualquer chave que contenha segmentos ".." (path traversal).
 *  - Rejeita chaves com caracteres nulos ou barras duplas que possam confundir o parser.
 *  - Verifica via path.resolve que o caminho resultante está dentro de baseDir.
 *
 * @throws {Error} se a chave for inválida ou tentar sair do diretório base.
 */
function sanitizeLocalKey(relKey: string, baseDir: string): string {
  // Rejeição explícita de padrões de path traversal antes de qualquer normalização
  if (relKey.includes("..")) {
    throw new Error(`Invalid file key: path traversal detected ("${relKey}")`);
  }
  if (relKey.includes("\0")) {
    throw new Error(`Invalid file key: null byte detected ("${relKey}")`);
  }

  // Remove barras iniciais e filtra segmentos vazios
  const stripped = relKey.replace(/^\/+/, "");
  const segments = stripped.split("/").filter(Boolean);

  // Rejeita segmentos que sejam apenas "." (referência ao diretório atual)
  for (const seg of segments) {
    if (seg === ".") {
      throw new Error(`Invalid file key: current-directory segment detected ("${relKey}")`);
    }
  }

  const safeKey = segments.join("/");

  // Verificação dupla via path.resolve: garante que o path resultante está dentro de baseDir
  const resolvedBase = path.resolve(baseDir);
  const resolvedFile = path.resolve(path.join(baseDir, safeKey));
  if (!resolvedFile.startsWith(resolvedBase + path.sep) && resolvedFile !== resolvedBase) {
    throw new Error(`Blocked path traversal attempt in file key: "${relKey}"`);
  }

  return safeKey;
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Faz upload de um arquivo para o storage.
 * - Se BUILT_IN_FORGE_API_URL/KEY estiverem configurados: usa o Manus Storage Proxy.
 * - Caso contrário (Railway, desenvolvimento local): salva em disco e retorna URL do servidor.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();

  // Modo Manus Storage Proxy — normalização simples (sem acesso ao filesystem)
  if (config) {
    const key = normalizeKey(relKey);
    const uploadUrl = buildUploadUrl(config.baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(config.apiKey),
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(
        `Storage upload failed (${response.status} ${response.statusText}): ${message}`
      );
    }
    const url = (await response.json()).url;
    return { key, url };
  }

  // Modo local: sanitiza a chave antes de qualquer operação de filesystem
  const safeLocalKey = sanitizeLocalKey(relKey, LOCAL_UPLOADS_DIR);
  const filePath = path.join(LOCAL_UPLOADS_DIR, safeLocalKey);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const buffer = typeof data === "string"
    ? Buffer.from(data, "utf-8")
    : Buffer.from(data as any);
  fs.writeFileSync(filePath, buffer);

  const url = `${getAppUrl()}/uploads/${safeLocalKey}`;
  return { key: safeLocalKey, url };
}

/**
 * Obtém a URL de download de um arquivo.
 * - Se BUILT_IN_FORGE_API_URL/KEY estiverem configurados: usa o Manus Storage Proxy.
 * - Caso contrário: retorna URL local do servidor (com sanitização da chave).
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();

  if (config) {
    const key = normalizeKey(relKey);
    return {
      key,
      url: await buildDownloadUrl(config.baseUrl, key, config.apiKey),
    };
  }

  // Modo local: sanitiza a chave para evitar path traversal na URL gerada
  const safeLocalKey = sanitizeLocalKey(relKey, LOCAL_UPLOADS_DIR);
  const url = `${getAppUrl()}/uploads/${safeLocalKey}`;
  return { key: safeLocalKey, url };
}
