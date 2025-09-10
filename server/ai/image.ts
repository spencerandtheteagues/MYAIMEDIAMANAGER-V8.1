import { makeClients } from "./clients";
import { MODELS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// Returns { pngBase64, meta }
export async function generateImage(opts:{prompt:string; aspectRatio?:string}) {
  const { genai, vertex } = makeClients();
  try{
    return await withRetry(async ()=>{
      if (vertex) {
        // Vertex/Imagen support would go here
        throw new Error("Imagen not yet implemented");
      } else {
        // For now, create a placeholder response since Imagen requires Vertex
        const imageId = randomUUID();
        const localPath = path.join('public', 'generated', `image-${imageId}.png`);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        
        // Create placeholder metadata
        const meta = { 
          model: MODELS.image, 
          aspectRatio: opts.aspectRatio || "1:1",
          prompt: opts.prompt,
          placeholder: true 
        };
        
        // Write metadata file
        await fs.writeFile(
          localPath.replace('.png', '.json'),
          JSON.stringify(meta, null, 2)
        );
        
        // Return empty base64 for now
        return { pngBase64: "", meta };
      }
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}