import { GoogleGenerativeAI } from "@google/generative-ai";

export function makeClients() {
  // Check for Vertex API key or service account
  const hasVertexKey = !!process.env.VERTEX_API_KEY;
  const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const useVertex = hasVertexKey || hasServiceAccount;
  
  if (useVertex) {
    // Vertex AI is configured - return a mock vertex client for now
    // In production, this would initialize the actual Vertex AI client
    const vertexClient = {
      apiKey: process.env.VERTEX_API_KEY,
      project: process.env.GOOGLE_CLOUD_PROJECT || "myaimediamgr",
      location: process.env.VERTEX_LOCATION || "us-central1",
      configured: true
    };
    
    if (process.env.GEMINI_API_KEY) {
      const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      return { genai, vertex: vertexClient };
    }
    // Return vertex only if no Gemini key
    return { genai: null as any, vertex: vertexClient };
  }
  
  if (process.env.GEMINI_API_KEY) {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return { genai, vertex: null as any };
  }
  
  throw new Error("No AI credentials configured. Set GEMINI_API_KEY, VERTEX_API_KEY, or GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_CLOUD_PROJECT.");
}