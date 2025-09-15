export function normalizeError(e:any){
  const msg = e?.message || "Unknown error";
  const code = e?.status || e?.code || 500;
  return { code: Number(code), message: msg };
}