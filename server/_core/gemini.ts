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
    model: "gemini-1.5-flash",
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
  try {
    return JSON.parse(text);
  } catch {
    // Às vezes o Gemini retorna com markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}`);
  }
}
