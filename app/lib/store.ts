const g: any = globalThis;
g.__guides ||= new Map();
g.__idx ||= new Map();
const U = process.env.UPSTASH_REDIS_REST_URL;
const H = { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` };

// key (normalized app name) -> latest generated guide id, so repeat searches reuse it.
export async function saveGuide(id: string, guide: any, key?: string) {
  g.__guides.set(id, guide);
  if (key) g.__idx.set(key, id);
  if (!U) return;
  await fetch(`${U}/set/guide:${id}`, { method: "POST", headers: H, body: JSON.stringify(guide) });
  if (key) await fetch(`${U}/set/idx:${key}`, { method: "POST", headers: H, body: id });
}

export async function loadGuide(id: string) {
  if (g.__guides.has(id)) return g.__guides.get(id);
  if (!U) return null;
  const r = await (await fetch(`${U}/get/guide:${id}`, { headers: H, cache: "no-store" })).json();
  return r.result ? JSON.parse(r.result) : null;
}

export async function findCached(key: string): Promise<string | null> {
  if (g.__idx.has(key)) return g.__idx.get(key);
  if (!U) return null;
  const r = await (await fetch(`${U}/get/idx:${key}`, { headers: H, cache: "no-store" })).json();
  return r.result || null;
}
