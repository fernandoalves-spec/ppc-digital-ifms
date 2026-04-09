/**
 * Módulo de extração de PDF via IA.
 * Prioridade: 1) Google Gemini (GEMINI_API_KEY), 2) OpenAI (OPENAI_API_KEY), 3) Manus (BUILT_IN_FORGE_API_KEY)
 */
import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

// ─── Gemini ──────────────────────────────────────────────────────────────────

let _geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!_geminiClient) {
    _geminiClient = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
  }
  return _geminiClient;
}

export function isGeminiAvailable(): boolean {
  return !!ENV.geminiApiKey;
}

export function isOpenAIAvailable(): boolean {
  return !!ENV.openaiApiKey;
}

/**
 * Detecta qual provedor de IA está disponível.
 */
export function getAvailableProvider(): "gemini" | "openai" | "manus" | "none" {
  if (ENV.geminiApiKey) return "gemini";
  if (ENV.openaiApiKey) return "openai";
  if (ENV.forgeApiKey) return "manus";
  return "none";
}

// ─── Extração via Gemini (envia PDF nativo) ──────────────────────────────────

export async function extractPdfWithGemini(params: {
  pdfBuffer: Buffer;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
}): Promise<unknown> {
  const client = getGeminiClient();
  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema } = params;

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

  return parseJsonResponse(text);
}

// ─── Extração via OpenAI (envia texto extraído do PDF) ───────────────────────

export async function extractPdfWithOpenAI(params: {
  pdfText: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}): Promise<unknown> {
  const { pdfText, systemPrompt, userPrompt, jsonSchema, schemaName } = params;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrompt}\n\n--- TEXTO DO PPC ---\n${pdfText}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: {
            ...jsonSchema,
            additionalProperties: false,
            properties: Object.fromEntries(
              Object.entries((jsonSchema as any).properties || {}).map(([key, val]: [string, any]) => {
                if (val.type === "array" && val.items?.properties) {
                  return [key, {
                    ...val,
                    items: {
                      ...val.items,
                      additionalProperties: false,
                    },
                  }];
                }
                return [key, val];
              })
            ),
          },
        },
      },
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} – ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI retornou resposta vazia");
  }

  return parseJsonResponse(content);
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Às vezes a IA retorna com markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error(`Resposta da IA não é JSON válido: ${text.substring(0, 200)}`);
  }
}
