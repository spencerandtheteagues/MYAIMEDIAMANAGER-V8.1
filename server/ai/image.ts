import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

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


// Returns { url, localPath, prompt, aspectRatio, model }
export async function generateImage(opts:{prompt:string; aspectRatio?:string; businessContext?: any}) {
  const { genai, vertex } = makeClients();
  const execAsync = promisify(exec);
  
  try{
    return await withRetry(async ()=>{
      const imageId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_images', `image-${imageId}.png`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Check if we have API key for real generation
      const apiKey = process.env.VERTEX_API_KEY;
      let imageBuffer: Buffer;
      let generationMethod = "imagen";
      let modelUsed = "imagen-4.0-generate-001";
      
      if (apiKey) {
        try {
          // Use Imagen for real text-to-image generation
          const scriptPath = path.join(process.cwd(), 'server', 'ai', 'imagen-generate.py');
          const inputData = {
            prompt: opts.prompt,
            aspectRatio: opts.aspectRatio || "16:9"
          };
          
          const { stdout, stderr } = await execAsync(
            `python3 "${scriptPath}" '${JSON.stringify(inputData)}'`,
            {
              env: {
                ...process.env,
                VERTEX_API_KEY: apiKey,
                GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || "replit-ai-project",
                VERTEX_LOCATION: process.env.VERTEX_LOCATION || "us-central1"
              },
              timeout: 60000 // 60 second timeout
            }
          );
          
          if (stderr && !stderr.includes('warning')) {
            console.error('Imagen generation stderr:', stderr);
          }
          
          const result = JSON.parse(stdout);
          
          if (result.success && result.image_data) {
            // Convert base64 to buffer
            imageBuffer = Buffer.from(result.image_data, 'base64');
            generationMethod = "imagen";
            modelUsed = result.model || "imagen-4.0-generate-001";
          } else {
            // If Imagen fails, return error
            throw new Error(result.error || 'Image generation failed');
          }
        } catch (error: any) {
          console.error('Error generating image with Imagen:', error);
          throw new Error(`Failed to generate image: ${error.message}`);
        }
      } else {
        throw new Error("Image generation requires VERTEX_API_KEY to be configured");
      }
      
      // Write the image file
      await fs.writeFile(localPath, imageBuffer);
      
      // Create metadata
      const meta = { 
        model: modelUsed,
        aspectRatio: opts.aspectRatio || "16:9",
        prompt: opts.prompt,
        vertex: true,
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
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}