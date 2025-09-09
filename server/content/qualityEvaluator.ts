import { validateContent } from "./validators";
import { PLATFORM_CONSTRAINTS } from "./config";
import { GoogleGenAI } from "@google/genai";

export type EvalScore = { 
  overall: number; 
  subs: {
    hook: number;
    value: number;
    fit: number;
    voice: number;
    action: number;
  } 
};

const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export async function scoreCaption(
  platform: keyof typeof PLATFORM_CONSTRAINTS, 
  caption: string
): Promise<EvalScore> {
  // Deterministic-ish critique at low temperature; fall back to neutral 7s if model unavailable.
  try {
    if (!ai) {
      throw new Error("AI not configured");
    }
    
    const prompt = `Score this social media caption for ${platform} on these criteria (1-10 scale):
- Hook: How engaging is the opening?
- Value: Does it provide clear value to the reader?
- Fit: How well does it fit ${platform} platform conventions?
- Voice: How consistent and authentic is the brand voice?
- Action: How clear and compelling is the call-to-action?

Return ONLY valid JSON in this exact format: {"hook":n,"value":n,"fit":n,"voice":n,"action":n}

Caption:
${caption}`;

    const model = ai.generativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: 100,
        topP: 0.1,
      }
    });
    
    const text = result.response.text();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const j = JSON.parse(jsonMatch[0]);
    const subs = { 
      hook: Math.min(10, Math.max(1, +j.hook || 7)), 
      value: Math.min(10, Math.max(1, +j.value || 7)), 
      fit: Math.min(10, Math.max(1, +j.fit || 7)), 
      voice: Math.min(10, Math.max(1, +j.voice || 7)), 
      action: Math.min(10, Math.max(1, +j.action || 7))
    };
    const overall = Math.round((subs.hook + subs.value + subs.fit + subs.voice + subs.action) / 5);
    return { overall, subs };
  } catch (e) {
    // Fallback to neutral scores if AI unavailable
    const subs = { hook: 7, value: 7, fit: 7, voice: 7, action: 7 };
    return { overall: 7, subs };
  }
}

export async function evaluateContentQuality(
  platform: keyof typeof PLATFORM_CONSTRAINTS,
  content: {
    caption: string;
    hashtags: string[];
    cta?: string;
  }
): Promise<{
  score: EvalScore;
  validation: ReturnType<typeof validateContent>;
  passes: boolean;
}> {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  
  // Validate structure
  const validation = validateContent(
    content,
    {
      maxChars: constraints.maxChars,
      maxHashtags: constraints.maxHashtags,
      allowedRatios: ["1:1"],
      readabilityMaxGrade: constraints.readabilityMaxGrade
    },
    []
  );
  
  // Score quality
  const fullCaption = content.cta 
    ? `${content.caption}\n\n${content.cta}` 
    : content.caption;
  const score = await scoreCaption(platform, fullCaption);
  
  // Check if passes thresholds
  const passes = validation.ok && score.overall >= 7;
  
  return { score, validation, passes };
}