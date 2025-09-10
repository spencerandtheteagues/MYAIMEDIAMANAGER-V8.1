import { GoogleGenAI } from "@google/genai";

export function makeClients() {
  // For now, we only support Gemini API key
  // Vertex AI support could be added later with service account JSON
  if (process.env.GEMINI_API_KEY) {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return { genai, vertex: null };
  }
  
  // Check for Google Cloud credentials (future support)
  const usingVertex = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (usingVertex) {
    // Would need to integrate Vertex AI SDK here
    console.warn("Vertex AI support not yet implemented, falling back to Gemini API");
  }
  
  throw new Error("No AI credentials configured. Set GEMINI_API_KEY environment variable.");
}