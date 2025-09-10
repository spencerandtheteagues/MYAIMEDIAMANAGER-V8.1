export async function withRetry<T>(fn:()=>Promise<T>, attempts=3, baseMs=400): Promise<T> {
  let lastErr:any;
  for (let i=0;i<attempts;i++){
    try { return await fn(); } catch (e:any){ lastErr=e; }
    await new Promise(r=>setTimeout(r, baseMs*Math.pow(2,i) + Math.random()*100));
  }
  throw lastErr;
}