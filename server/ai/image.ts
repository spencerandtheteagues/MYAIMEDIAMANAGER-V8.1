import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { generateImageWithImagen4 } from './gemini-image';

// Helper to parse aspect ratio
function parseAspectRatio(ratio: string): { width: number; height: number } {
  const aspectRatios: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "4:3": { width: 1440, height: 1080 },
    "3:2": { width: 1620, height: 1080 },
    "21:9": { width: 2560, height: 1080 }
  };
  return aspectRatios[ratio] || aspectRatios["16:9"];
}


// Enhanced prompt builder for professional media generation
function buildEnhancedPrompt(originalPrompt: string, businessContext?: any): string {
  let enhancedPrompt = originalPrompt;

  // Professional quality baseline
  let qualityEnhancement = "professional photography, high-resolution, crisp details, award-winning composition";

  // Add context-aware enhancements based on business context
  if (businessContext) {
    const { visualStyle, colorScheme, environment, lighting, mood, composition, cameraAngle } = businessContext;

    // Visual style enhancement
    if (visualStyle === 'Photo-Realistic' || visualStyle === 'photo-realistic') {
      qualityEnhancement = "ultra-realistic photography, photorealistic, hyperdetailed, professional studio lighting, cinematic quality, 8K resolution";
    } else if (visualStyle === 'artistic') {
      qualityEnhancement = "artistic masterpiece, vibrant colors, creative composition, fine art quality";
    } else if (visualStyle === 'modern') {
      qualityEnhancement = "modern design aesthetic, clean lines, contemporary style, minimalist elegance";
    }

    // Camera angle enhancement
    const cameraEnhancements = {
      'Eye Level': 'shot at eye level, natural perspective, balanced composition',
      'Low Angle': 'dramatic low angle shot, powerful perspective, cinematic drama',
      'High Angle': 'elevated high angle view, commanding perspective, overview composition',
      'Close-up': 'intimate close-up shot, detailed focus, shallow depth of field',
      'Wide Shot': 'wide establishing shot, comprehensive view, environmental context'
    };

    if (cameraAngle && cameraEnhancements[cameraAngle]) {
      qualityEnhancement += `, ${cameraEnhancements[cameraAngle]}`;
    }

    // Environment enhancement
    const environmentEnhancements = {
      'Studio': 'professional studio setting, controlled lighting, seamless backdrop, commercial quality',
      'Office': 'modern office environment, professional workspace, corporate aesthetic, clean organized space',
      'Outdoor': 'natural outdoor setting, environmental lighting, authentic location, scenic backdrop',
      'Home': 'comfortable home environment, warm inviting atmosphere, personal touch, lifestyle setting'
    };

    if (environment && environmentEnhancements[environment]) {
      qualityEnhancement += `, ${environmentEnhancements[environment]}`;
    }

    // Lighting enhancement
    const lightingEnhancements = {
      'Natural Light': 'beautiful natural lighting, soft diffused light, golden hour quality, organic illumination',
      'Studio Lighting': 'professional studio lighting setup, perfect exposure, dramatic lighting, controlled shadows',
      'Dramatic': 'dramatic chiaroscuro lighting, high contrast, moody atmosphere, cinematic shadows',
      'Soft': 'soft gentle lighting, even illumination, flattering glow, ethereal ambiance'
    };

    if (lighting && lightingEnhancements[lighting]) {
      qualityEnhancement += `, ${lightingEnhancements[lighting]}`;
    }

    // Mood enhancement
    const moodEnhancements = {
      'Bright & Cheerful': 'bright cheerful atmosphere, positive energy, uplifting mood, vibrant optimism',
      'Professional': 'professional authoritative mood, business confidence, corporate excellence, trustworthy presence',
      'Creative': 'creative innovative spirit, artistic inspiration, imaginative flair, original thinking',
      'Calm': 'serene peaceful atmosphere, tranquil mood, relaxing ambiance, harmonious balance'
    };

    if (mood && moodEnhancements[mood]) {
      qualityEnhancement += `, ${moodEnhancements[mood]}`;
    }

    // Composition enhancement
    const compositionEnhancements = {
      'Rule of Thirds': 'perfect rule of thirds composition, balanced visual weight, dynamic arrangement',
      'Centered': 'perfectly centered composition, symmetrical balance, focal point emphasis',
      'Leading Lines': 'strong leading lines composition, visual flow, directional emphasis',
      'Framing': 'natural framing elements, layered composition, depth and dimension'
    };

    if (composition && compositionEnhancements[composition]) {
      qualityEnhancement += `, ${compositionEnhancements[composition]}`;
    }

    // Color scheme enhancement
    if (colorScheme) {
      qualityEnhancement += `, rich ${colorScheme} color palette, harmonious color grading, professional color correction`;
    }
  }

  // Combine original prompt with enhancements
  enhancedPrompt = `${originalPrompt}, ${qualityEnhancement}`;

  // Remove potential duplicates and clean up
  enhancedPrompt = enhancedPrompt
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return enhancedPrompt;
}

// DALL-E 3 generation using direct API calls (no Python dependencies)
async function generateWithDALLE3(prompt: string, aspectRatio: string): Promise<Buffer> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Map aspect ratios to DALL-E 3 supported sizes
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024", // Closest supported
    "3:4": "1024x1024"  // Closest supported
  };

  const size = sizeMap[aspectRatio] || "1024x1024";

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
        quality: "hd",
        style: "vivid"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DALL-E 3 API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      throw new Error('No image returned from DALL-E 3');
    }

    const imageUrl = result.data[0].url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch (error: any) {
    console.error('DALL-E 3 generation error:', error);
    throw error;
  }
}

// Returns { url, localPath, prompt, aspectRatio, model }
export async function generateImage(opts:{prompt:string; aspectRatio?:string; businessContext?: any; model?: 'gemini' | 'openai' | 'auto'}) {
  const { genai, vertex } = makeClients();

  try{
    return await withRetry(async ()=>{
      const imageId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_images', `image-${imageId}.png`);

      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // Build enhanced prompt based on user settings and business context
      const enhancedPrompt = buildEnhancedPrompt(opts.prompt, opts.businessContext);
      console.log('Enhanced prompt:', enhancedPrompt);

      let imageBuffer: Buffer;
      let generationMethod = "imagen";
      let modelUsed = "imagen-4.0-generate-001";

      // Determine which model to use
      const preferredModel = opts.model || 'auto';

      if (preferredModel === 'gemini' || (preferredModel === 'auto' && process.env.GEMINI_API_KEY)) {
        // Try Gemini/Imagen 4 first
        try {
          console.log('Using Gemini Imagen 4 for image generation...');
          imageBuffer = await generateImageWithImagen4(enhancedPrompt, opts.aspectRatio || "16:9");
          generationMethod = "imagen-4";
          modelUsed = "gemini-imagen-4";
        } catch (geminiError: any) {
          console.error('Gemini generation failed:', geminiError.message);
          if (preferredModel === 'gemini') {
            throw new Error(`Gemini image generation failed: ${geminiError.message}`);
          }
          // Fall through to try other methods if auto mode
        }
      }

      // If Gemini failed or OpenAI model selected, try DALL-E 3
      if (!imageBuffer && (preferredModel === 'openai' || preferredModel === 'auto')) {
        try {
          console.log('Using DALL-E 3 for image generation...');
          imageBuffer = await generateWithDALLE3(enhancedPrompt, opts.aspectRatio || "16:9");
          generationMethod = "dall-e-3";
          modelUsed = "dall-e-3";
        } catch (dalleError: any) {
          console.error('DALL-E 3 generation failed:', dalleError.message);
          if (preferredModel === 'openai') {
            throw new Error(`DALL-E 3 image generation failed: ${dalleError.message}`);
          }
          // Continue to fallback if auto mode
        }
      }

      // If all AI models failed, provide helpful error message
      if (!imageBuffer) {
        throw new Error('Image generation failed: No available AI models could generate the image. Please check your API keys for OpenAI (DALL-E 3) or Google (Gemini/Imagen 4).');
      }

      // Write the image file
      await fs.writeFile(localPath, imageBuffer);
      
      // Create metadata
      const meta = {
        model: modelUsed,
        aspectRatio: opts.aspectRatio || "16:9",
        originalPrompt: opts.prompt,
        enhancedPrompt: enhancedPrompt,
        businessContext: opts.businessContext,
        generationMethod,
        createdAt: new Date().toISOString()
      };
      
      // Write metadata file
      await fs.writeFile(
        localPath.replace('.png', '.json'),
        JSON.stringify(meta, null, 2)
      );
      
      // Return structured response
      return { 
        url: `/${localPath}`,
        localPath,
        prompt: opts.prompt,
        aspectRatio: opts.aspectRatio || "16:9",
        model: modelUsed,
        generationMethod
      };
    });
  } catch(e:any) {
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}