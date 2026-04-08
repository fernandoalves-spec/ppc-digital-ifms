 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/server/_core/gemini.ts b/server/_core/gemini.ts
index b033600eb34efbdb2457adf716407e112f301fa4..fa5523212fd76364a7398f3528de18f0718b0ae6 100644
--- a/server/_core/gemini.ts
+++ b/server/_core/gemini.ts
@@ -1,180 +1,95 @@
---- server/_core/gemini.ts (原始)
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
-  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema, schemaName } = params;
-
-  const base64Pdf = pdfBuffer.toString("base64");
-
-  const response = await client.models.generateContent({
-    model: "gemini-2.5-flash",
-    config: {
-      systemInstruction: systemPrompt,
-      responseMimeType: "application/json",
-      responseSchema: jsonSchema as any,
-    },
-    contents: [
-      {
-        role: "user",
-        parts: [
-          {
-            inlineData: {
-              mimeType: "application/pdf",
-              data: base64Pdf,
-            },
-          },
-          {
-            text: userPrompt,
-          },
-        ],
-      },
-    ],
-  });
-
-  const text = response.text;
-  if (!text) {
-    throw new Error("Gemini retornou resposta vazia");
-  }
-
-  // Tenta parsear o JSON retornado
-  try {
-    return JSON.parse(text);
-  } catch {
-    // Às vezes o Gemini retorna com markdown code block
-    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
-    if (match) {
-      return JSON.parse(match[1]);
-    }
-    throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}`);
-  }
-}
-
-+++ server/_core/gemini.ts (修改后)
-/**
- * Módulo de integração direta com Google Gemini API.
- * Usado quando BUILT_IN_FORGE_API_KEY não está disponível (ex: Railway).
- */
-import { GoogleGenAI } from "@google/genai";
-import { ENV } from "./env";
-
-let _client: GoogleGenAI | null = null;
-
-function getClient(): GoogleGenAI {
-  if (!ENV.geminiApiKey) {
-    throw new Error("GEMINI_API_KEY não está configurada. Adicione a variável de ambiente GEMINI_API_KEY.");
-  }
-  if (!_client) {
-    _client = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
-  }
-  return _client;
-}
-
-export function isGeminiAvailable(): boolean {
-  return !!ENV.geminiApiKey;
-}
-
-/**
- * Extrai dados estruturados de um PDF usando o Gemini diretamente.
- * Envia o PDF como bytes (base64) para o Gemini processar nativamente.
- */
-export async function extractPdfWithGemini(params: {
-  pdfBuffer: Buffer;
-  systemPrompt: string;
-  userPrompt: string;
-  jsonSchema: Record<string, unknown>;
-  schemaName: string;
-}): Promise<unknown> {
-  const client = getClient();
-  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema, schemaName } = params;
+  const { pdfBuffer, systemPrompt, userPrompt, jsonSchema } = params;
 
   const base64Pdf = pdfBuffer.toString("base64");
 
   console.log(`[Gemini] Enviando PDF de ${base64Pdf.length} caracteres base64 para processamento...`);
 
   const response = await client.models.generateContent({
     model: "gemini-2.5-flash",
     config: {
       systemInstruction: systemPrompt,
       responseMimeType: "application/json",
       responseSchema: jsonSchema as any,
-      maxOutputTokens: 8192, // Aumenta limite de tokens de saída
+      maxOutputTokens: 8192,
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
 
   console.log(`[Gemini] Resposta recebida: ${text.length} caracteres`);
 
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
       }
     }
 
-    // Log completo do erro para debugging
     console.error(`[Gemini] Erro ao parsear JSON. Primeiros 500 chars: ${text.substring(0, 500)}`);
     console.error(`[Gemini] Últimos 500 chars: ${text.substring(text.length - 500)}`);
     console.error(`[Gemini] Erro: ${parseError}`);
 
     throw new Error(`Resposta do Gemini não é JSON válido: ${text.substring(0, 200)}... (total: ${text.length} chars)`);
   }
 }
 
EOF
)
