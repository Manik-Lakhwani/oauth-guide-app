import { runAgent } from "../../../lib/agent";
import { saveGuide, findCached, loadGuide } from "../../../lib/store";
import { getLibraryGuide } from "../../../lib/library";
import { normKey } from "../../../lib/key";

export const maxDuration = 300;
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const { app, force } = await req.json().catch(() => ({ app: "", force: false }));
  const name = String(app || "").trim().slice(0, 200);
  const key = normKey(name);
  if (name.length < 2 || !key) return new Response("Enter an app name or website", { status: 400 });

  const enc = new TextEncoder();
  const line = (o: any) => enc.encode(JSON.stringify(o) + "\n");
  const headers = { "content-type": "application/x-ndjson", "cache-control": "no-store" };

  // Reuse an existing guide instead of spending quota, unless the user asked for a fresh one.
  if (!force) {
    const existing = getLibraryGuide(key) ? key : await findCached(key);
    if (existing && (getLibraryGuide(existing) || (await loadGuide(existing)))) {
      return new Response(line({ type: "done", id: existing, existing: true }), { headers });
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= Number(process.env.HOURLY_LIMIT || 5)) return new Response("Rate limit reached. Try again later.", { status: 429 });
  hits.set(ip, [...recent, now]);

  const stream = new ReadableStream({
    async start(c) {
      const send = (o: any) => c.enqueue(line(o));
      try {
        const guide = await runAgent(name, (s) => send({ type: "stage", text: s }));
        const id = `${key.slice(0, 30)}-${Math.random().toString(36).slice(2, 7)}`;
        await saveGuide(id, guide, key);
        send({ type: "done", id });
      } catch (e: any) { send({ type: "error", text: e.message }); }
      c.close();
    },
  });
  return new Response(stream, { headers });
}
