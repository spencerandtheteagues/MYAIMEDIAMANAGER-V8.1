import { makeClients } from "./clients";
import { MODELS, DEFAULTS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";
import { randomUUID } from "crypto";

/** Start a Veo job and return an operation ID. */
export async function startVideo(opts:{prompt:string; durationSeconds?:number; fast?:boolean}) {
  const { vertex } = makeClients();
  if (!vertex) {
    const err = new Error("Video generation requires Vertex credentials. Ask support to enable.");
    Object.assign(err,{ status: 501 });
    throw err;
  }
  const modelId = opts.fast ? MODELS.veoFast : MODELS.veoFull;
  const dur = Math.min(Math.max(2, opts.durationSeconds ?? DEFAULTS.videoDurSec), 20);
  try{
    return await withRetry(async ()=>{
      // Simulated video operation for now
      const operationId = `video-op-${randomUUID()}`;
      return { 
        operationId,
        status: "processing",
        estimatedCompletionTime: new Date(Date.now() + 60000).toISOString()
      };
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}

/** Poll by op ID; return { operationId, status, videoUrl?, error?, progress? } when done. */
export async function pollVideo(opts:{operationId:string}) {
  const { vertex } = makeClients();
  if (!vertex) {
    const err = new Error("Video generation requires Vertex credentials.");
    Object.assign(err,{ status: 501 });
    throw err;
  }
  try{
    return await withRetry(async ()=>{
      // Simulated polling for now
      return { 
        operationId: opts.operationId,
        status: "processing" as const,
        videoUrl: undefined,
        error: undefined,
        progress: 0.5
      };
    }, 5);
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}