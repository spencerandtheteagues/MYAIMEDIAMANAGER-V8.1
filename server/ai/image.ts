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
import OpenAI from 'openai';

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
  // Start with the original prompt as the foundation - this should never be modified
  let enhancedPrompt = originalPrompt;

  // Only add enhancements that improve quality without changing the core subject/content
  let qualityEnhancement = "";

  // Check if this is clearly a business/professional context request
  const isBusinessRequest = businessContext && (
    businessContext.visualStyle === 'Professional' ||
    businessContext.mood === 'Professional' ||
    businessContext.environment === 'Office' ||
    businessContext.environment === 'Studio'
  );

  // Industry-specific STYLE enhancements (not content changes)
  const industryStyles = {
    fashion: "high fashion photography style, editorial quality lighting, professional modeling pose",
    food: "food photography styling, appetizing presentation, professional culinary photography",
    tech: "clean modern aesthetic, minimalist design, professional product photography",
    fitness: "dynamic athletic photography, energetic composition, sports photography style",
    beauty: "beauty photography lighting, flawless skin rendering, cosmetic advertising quality",
    real_estate: "architectural photography style, professional interior design lighting",
    automotive: "automotive photography style, dynamic vehicle composition, commercial car photography",
    business: "professional corporate photography style, executive portrait quality, business headshot lighting",
    healthcare: "clean medical photography style, professional healthcare aesthetic",
    education: "educational photography style, academic environment lighting",
    finance: "corporate finance photography style, professional business aesthetic",
    travel: "travel photography style, destination photography quality, wanderlust aesthetic"
  };

  // Detect industry ONLY from explicit context or very clear prompt indicators
  const detectIndustryFromPrompt = (prompt: string): string | null => {
    const lowerPrompt = prompt.toLowerCase();

    // Only detect if the prompt explicitly mentions business/professional contexts
    if (lowerPrompt.includes('corporate headshot') || lowerPrompt.includes('business portrait') || lowerPrompt.includes('executive photo')) {
      return 'business';
    } else if (lowerPrompt.includes('product photography') || lowerPrompt.includes('commercial photo')) {
      return 'business';
    } else if (lowerPrompt.includes('food photography') || lowerPrompt.includes('restaurant menu')) {
      return 'food';
    } else if (lowerPrompt.includes('fashion shoot') || lowerPrompt.includes('fashion photography')) {
      return 'fashion';
    }

    return null; // No clear industry context - let the original prompt drive everything
  };

  // Detect industry from prompt content (very conservative)
  const promptIndustry = detectIndustryFromPrompt(originalPrompt);

  // Apply industry styling only if detected from prompt OR if business context strongly indicates it
  if (promptIndustry) {
    qualityEnhancement = industryStyles[promptIndustry as keyof typeof industryStyles];
  } else if (isBusinessRequest && originalPrompt.toLowerCase().includes('person')) {
    // Only apply business styling if it's clearly a person-focused business request
    qualityEnhancement = "professional photography style, business quality lighting, corporate aesthetic";
  } else {
    // Default to general quality enhancement that works for any subject
    qualityEnhancement = "high quality photography, professional lighting, award-winning composition";
  }

  // Add context-aware STYLE enhancements based on business context (never change content)
  if (businessContext) {
    const { visualStyle, colorScheme, environment, lighting, mood, composition, cameraAngle } = businessContext;

    // Visual style enhancement - STYLE ONLY
    if (visualStyle === 'Photo-Realistic' || visualStyle === 'photo-realistic') {
      qualityEnhancement += ", ultra-realistic photography, photorealistic, hyperdetailed, professional studio lighting, cinematic quality, 8K resolution";
    } else if (visualStyle === 'artistic') {
      qualityEnhancement += ", artistic masterpiece, vibrant colors, creative composition, fine art quality";
    } else if (visualStyle === 'modern') {
      qualityEnhancement += ", modern design aesthetic, clean lines, contemporary style, minimalist elegance";
    }

    // Camera angle enhancement - TECHNICAL ONLY
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

    // Environment enhancement - ONLY if original prompt doesn't specify a setting
    const environmentEnhancements = {
      'Studio': 'professional studio setting, controlled lighting, seamless backdrop',
      'Office': 'modern office environment, professional workspace aesthetic',
      'Outdoor': 'natural outdoor setting, environmental lighting, authentic location',
      'Home': 'comfortable home environment, warm inviting atmosphere'
    };

    // Only add environment if the original prompt doesn't already specify a location
    const hasLocation = /\b(in|at|on|inside|outside|studio|office|home|outdoors?|indoors?|room|building)\b/i.test(originalPrompt);
    if (environment && environmentEnhancements[environment] && !hasLocation) {
      qualityEnhancement += `, ${environmentEnhancements[environment]}`;
    }

    // Lighting enhancement - TECHNICAL STYLE ONLY
    const lightingEnhancements = {
      'Natural Light': 'beautiful natural lighting, soft diffused light, golden hour quality',
      'Studio Lighting': 'professional studio lighting setup, perfect exposure, controlled shadows',
      'Dramatic': 'dramatic chiaroscuro lighting, high contrast, moody atmosphere',
      'Soft': 'soft gentle lighting, even illumination, flattering glow'
    };

    if (lighting && lightingEnhancements[lighting]) {
      qualityEnhancement += `, ${lightingEnhancements[lighting]}`;
    }

    // Mood enhancement - ATMOSPHERE ONLY (never change the subject)
    const moodEnhancements = {
      'Bright & Cheerful': 'bright cheerful atmosphere, positive energy, uplifting mood',
      'Professional': 'professional authoritative mood, business confidence, trustworthy presence',
      'Creative': 'creative innovative spirit, artistic inspiration, imaginative flair',
      'Calm': 'serene peaceful atmosphere, tranquil mood, relaxing ambiance'
    };

    if (mood && moodEnhancements[mood]) {
      qualityEnhancement += `, ${moodEnhancements[mood]}`;
    }

    // Composition enhancement - TECHNICAL ONLY
    const compositionEnhancements = {
      'Rule of Thirds': 'perfect rule of thirds composition, balanced visual weight',
      'Centered': 'perfectly centered composition, symmetrical balance',
      'Leading Lines': 'strong leading lines composition, visual flow',
      'Framing': 'natural framing elements, layered composition, depth and dimension'
    };

    if (composition && compositionEnhancements[composition]) {
      qualityEnhancement += `, ${compositionEnhancements[composition]}`;
    }

    // Color scheme enhancement - STYLE ONLY
    if (colorScheme) {
      qualityEnhancement += `, rich ${colorScheme} color palette, harmonious color grading, professional color correction`;
    }
  }

  // Combine original prompt with enhancements - PROMPT ALWAYS COMES FIRST
  enhancedPrompt = qualityEnhancement
    ? `${originalPrompt}, ${qualityEnhancement}`
    : originalPrompt;

  // Remove potential duplicates and clean up
  enhancedPrompt = enhancedPrompt
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return enhancedPrompt;
}

// DALL-E 3 generation using OpenAI SDK
async function generateWithDALLE3(prompt: string, aspectRatio: string): Promise<Buffer> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: openaiKey,
  });

  // Map aspect ratios to DALL-E 3 supported sizes
  const sizeMap: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024", // Closest supported
    "3:4": "1024x1792", // Closer to 3:4 ratio
    "3:2": "1792x1024"  // Add 3:2 mapping for photo ratio
  };

  const size = sizeMap[aspectRatio] || "1024x1024";

  try {
    // Clean and limit prompt for DALL-E 3 (OpenAI recommends max 4000 chars)
    const cleanPrompt = prompt.length > 4000 ? prompt.substring(0, 4000) : prompt;

    console.log(`🎨 DALL-E 3 Request - Size: ${size}, Prompt length: ${cleanPrompt.length}`);
    console.log(`🎨 DALL-E 3 Prompt: ${cleanPrompt.substring(0, 200)}...`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: cleanPrompt,
      n: 1,
      size: size,
      quality: "standard", // Use standard instead of hd for faster/cheaper generation
      style: "vivid",
      response_format: "url"
    });

    console.log(`✅ DALL-E 3 Response received successfully`);

    if (!response.data || response.data.length === 0) {
      throw new Error('No image returned from DALL-E 3');
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    console.log(`📥 Downloading image from: ${imageUrl.substring(0, 50)}...`);

    // Download the image with timeout
    const imageResponse = await fetch(imageUrl, {
      timeout: 30000 // 30 second timeout
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✅ Image downloaded successfully: ${buffer.length} bytes`);
    return buffer;

  } catch (error: any) {
    // Enhanced error handling for OpenAI API errors
    console.error('❌ DALL-E 3 generation error:', {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status,
      promptLength: prompt.length,
      aspectRatio: aspectRatio,
      size: size
    });

    // Handle specific OpenAI errors with user-friendly messages
    if (error.code === 'content_policy_violation') {
      throw new Error('DALL-E 3: Content policy violation - please modify your prompt to avoid restricted content');
    } else if (error.code === 'billing_hard_limit_reached') {
      throw new Error('DALL-E 3: Billing limit reached - please check your OpenAI account');
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error('DALL-E 3: Rate limit exceeded - please try again in a moment');
    } else if (error.status === 401) {
      throw new Error('DALL-E 3: Invalid API key - please check configuration');
    } else if (error.status === 429) {
      throw new Error('DALL-E 3: Too many requests - please wait and try again');
    } else if (error.status === 500) {
      throw new Error('DALL-E 3: OpenAI server error - service temporarily unavailable');
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error('DALL-E 3: Request timed out - please try again');
    }

    // Fallback error message with original error for debugging
    throw new Error(`DALL-E 3 generation failed: ${error.message || 'Unknown error occurred'}`);
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