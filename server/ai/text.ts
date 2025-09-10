import { makeClients } from "./clients";
import { MODELS, DEFAULTS } from "./config";
import { withRetry } from "./retry";
import { normalizeError } from "./errors";

export async function generateText(opts:{prompt:string; system?:string; temperature?:number}) {
  const { genai, vertex } = makeClients();
  const temperature = opts.temperature ?? DEFAULTS.temperature;
  try{
    return await withRetry(async ()=>{
      if (vertex) {
        // Vertex support would go here
        throw new Error("Vertex AI not yet implemented");
      } else {
        const model = genai.generativeModel({ model: MODELS.text, systemInstruction: opts.system });
        const r = await model.generateContent({ contents:[{ role:"user", parts:[{ text: opts.prompt }]}], generationConfig:{ temperature }});
        const out = r.response?.text() || "";
        return { text: out };
      }
    });
  }catch(e:any){
    const ne = normalizeError(e);
    throw Object.assign(new Error(ne.message), { status: ne.code });
  }
}