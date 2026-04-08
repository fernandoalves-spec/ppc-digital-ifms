--- server/_core/gemini.ts (原始)
/**
 * Módulo de integração direta com Google Gemini API.
 * Usado quando BUILT_IN_FORGE_API_KEY não está disponível (ex: Railway).
 */
import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY não está configurada. Adicione a variável de ambiente GEMINI_API_KEY.");
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
  }
  return _client;
}

export function isGeminiAvailable(): boolean {
  return !!ENV.geminiApiKey;
}

/**
 * Extrai dados estruturados de um PDF usando o Gemini diretamente.
 * Envia o PDF como bytes (base64) para o Gemini processar nativamente.
 */
export async function extractPdfWithGemini(params: {
  pdfBuffer: Buffer;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}): Promise<unknown> {
  const client = getClient();
  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema, schemaName } = params;

  const base64Pdf = pdfBuffer.toString("base64");

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: jsonSchema as any,
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
    ],
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini retornou resposta vazia");
  }

  // Tenta parsear o JSON retornado
function parseGeminiJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Às vezes o Gemini retorna com markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}`);
    // continua para estratégias de recuperação
  }
}

+++ server/_core/gemini.ts (修改后)
/**
 * Módulo de integração direta com Google Gemini API.
 * Usado quando BUILT_IN_FORGE_API_KEY não está disponível (ex: Railway).
 */
import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY não está configurada. Adicione a variável de ambiente GEMINI_API_KEY.");
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // continua para estratégias de recuperação
    }
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: ENV.geminiApiKey });

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonSlice = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonSlice);
  }
  return _client;
}

export function isGeminiAvailable(): boolean {
  return !!ENV.geminiApiKey;
  throw new Error("Resposta não contém um objeto JSON parseável");
}

/**
 * Extrai dados estruturados de um PDF usando o Gemini diretamente.
 * Envia o PDF como bytes (base64) para o Gemini processar nativamente.
 */
export async function extractPdfWithGemini(params: {
  pdfBuffer: Buffer;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}): Promise<unknown> {
  const client = getClient();
  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema, schemaName } = params;
  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema } = params;

  const base64Pdf = pdfBuffer.toString("base64");
  const tokenAttempts = Array.from(new Set([
    Math.max(1024, ENV.geminiMaxOutputTokens),
    Math.max(16384, ENV.geminiMaxOutputTokens * 2),
    Math.max(32768, ENV.geminiMaxOutputTokens * 4),
  ]));

  console.log(`[Gemini] Enviando PDF de ${base64Pdf.length} caracteres base64 para processamento...`);

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: jsonSchema as any,
      maxOutputTokens: 8192, // Aumenta limite de tokens de saída
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            text: userPrompt,
          },
        ],
  for (let i = 0; i < tokenAttempts.length; i += 1) {
    const maxOutputTokens = tokenAttempts[i];
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: jsonSchema as any,
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: ENV.geminiThinkingBudget } as any,
        temperature: 0,
      },
    ],
  });
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini retornou resposta vazia");
    }

  const text = response.text;
  if (!text) {
    throw new Error("Gemini retornou resposta vazia");
  }
    console.log(`[Gemini] Resposta recebida: ${text.length} caracteres (maxOutputTokens=${maxOutputTokens})`);

  console.log(`[Gemini] Resposta recebida: ${text.length} caracteres`);
    try {
      return parseGeminiJson(text);
    } catch (parseError) {
      const isLastAttempt = i === tokenAttempts.length - 1;
      console.error(`[Gemini] Erro ao parsear JSON (tentativa ${i + 1}/${tokenAttempts.length}).`);
      console.error(`[Gemini] Primeiros 500 chars: ${text.substring(0, 500)}`);
      console.error(`[Gemini] Últimos 500 chars: ${text.substring(Math.max(0, text.length - 500))}`);
      console.error(`[Gemini] Erro: ${parseError}`);

  // Tenta parsear o JSON retornado
  try {
    return JSON.parse(text);
  } catch (parseError) {
    // Às vezes o Gemini retorna com markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Fall through to error
      if (!isLastAttempt) {
        console.warn(`[Gemini] Retentando com mais tokens. Próxima tentativa: maxOutputTokens=${tokenAttempts[i + 1]}`);
        continue;
      }
    }

    // Log completo do erro para debugging
    console.error(`[Gemini] Erro ao parsear JSON. Primeiros 500 chars: ${text.substring(0, 500)}`);
    console.error(`[Gemini] Últimos 500 chars: ${text.substring(text.length - 500)}`);
    console.error(`[Gemini] Erro: ${parseError}`);

    throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}... (total: ${text.length} chars)`);
      throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}... (total: ${text.length} chars)`);
    }
  }

  throw new Error("Falha inesperada ao processar resposta do Gemini");
}
