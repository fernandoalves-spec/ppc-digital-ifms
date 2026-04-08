import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
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

export function isGeminiAvailable(): boolean {
  return Boolean(ENV.geminiApiKey);
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

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

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
