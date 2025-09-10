import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// Returns { url, localPath, prompt, aspectRatio, model }
export async function generateImage(opts:{prompt:string; aspectRatio?:string}) {
  const { genai, vertex } = makeClients();
  try{
    return await withRetry(async ()=>{
      // Always use placeholder image generation for now
      // Real Imagen implementation would go here when available
      const imageId = randomUUID();
      const localPath = path.join('attached_assets', 'generated_images', `image-${imageId}.png`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // Create placeholder metadata
      const meta = { 
        model: MODELS.image, 
        aspectRatio: opts.aspectRatio || "1:1",
        prompt: opts.prompt,
        vertex: !!vertex  // Track if Vertex is configured
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
        aspectRatio: opts.aspectRatio || "1:1",
        model: MODELS.image
      };
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}