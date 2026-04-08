import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

let client: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(): GoogleGenAI {
  const runtimeApiKey = process.env.GEMINI_API_KEY ?? ENV.geminiApiKey;
  if (!runtimeApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!client || cachedApiKey !== runtimeApiKey) {
    client = new GoogleGenAI({ apiKey: runtimeApiKey });
    cachedApiKey = runtimeApiKey;
  }

  return client;
}

function parseGeminiJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Gemini may wrap JSON inside markdown fences.
    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fencedMatch) {
      try {
        return JSON.parse(fencedMatch[1]);
      } catch {
        // continue to fallback parsing
      }
    }

    // Fallback: try parsing the widest JSON object slice.
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonSlice = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSlice);
    }

    throw new Error(`Gemini response does not contain valid JSON. Preview: ${text.slice(0, 200)}`);
  }
}

function getResponseText(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("Gemini returned an invalid response object.");
  }

  const textLike = (response as { text?: unknown }).text;
  if (typeof textLike === "string" && textLike.trim().length > 0) {
    return textLike;
  }
  if (typeof textLike === "function") {
    const value = textLike();
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const candidateText = (response as { candidates?: unknown[] }).candidates
    ?.flatMap((candidate) =>
      typeof candidate === "object" && candidate
        ? ((candidate as { content?: { parts?: Array<{ text?: unknown }> } }).content?.parts ?? [])
        : [],
    )
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();

  if (candidateText) {
    return candidateText;
  }

  throw new Error("Gemini returned an empty text response.");
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? ENV.geminiApiKey);
}

export async function extractPdfWithGemini(params: {
  pdfBuffer: Buffer;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
}): Promise<unknown> {
  const geminiClient = getClient();
  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema, schemaName } = params;

  const base64Pdf = pdfBuffer.toString("base64");
  const tokenAttempts = Array.from(
    new Set([
      Math.max(1024, ENV.geminiMaxOutputTokens),
      Math.max(16384, ENV.geminiMaxOutputTokens * 2),
      Math.max(32768, ENV.geminiMaxOutputTokens * 4),
    ]),
  );

  for (let attempt = 0; attempt < tokenAttempts.length; attempt += 1) {
    const maxOutputTokens = tokenAttempts[attempt];

    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: jsonSchema as any,
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: ENV.geminiThinkingBudget } as any,
        temperature: 0,
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

    const text = getResponseText(response);

    try {
      return parseGeminiJson(text);
    } catch (error) {
      const isLastAttempt = attempt === tokenAttempts.length - 1;

      console.error(
        `[Gemini] JSON parse failed for schema=${schemaName}, attempt=${attempt + 1}/${tokenAttempts.length}, maxOutputTokens=${maxOutputTokens}`,
      );
      console.error(`[Gemini] Response preview: ${text.slice(0, 500)}`);
      console.error(`[Gemini] Error: ${error}`);

      if (isLastAttempt) {
        throw new Error(
          `Gemini response is not valid JSON after ${tokenAttempts.length} attempt(s). Preview: ${text.slice(0, 200)}`,
        );
      }
    }
  }

  throw new Error("Unexpected Gemini processing failure.");
}
