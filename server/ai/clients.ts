import { GoogleGenAI } from "@google/genai";

export function makeClients() {
  const useVertex = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (useVertex) {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    const project = process.env.GOOGLE_CLOUD_PROJECT!;
    const location = process.env.VERTEX_LOCATION || "us-central1";
    // Vertex AI support would go here
    // For now, fall through to Gemini API
  }
  if (process.env.GEMINI_API_KEY) {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return { genai, vertex: null as any };
  }
  throw new Error("No AI credentials configured. Set GEMINI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_CLOUD_PROJECT.");
}