import { GoogleGenAI, Type } from "@google/genai";
import Ajv from "ajv";
import schema from "../spec/guide_schema.json";
import { SYSTEM } from "./prompt";
import { httpProbe } from "./probe";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Free tier quotas are per model per day, so list several models (comma separated) to rotate through.
const MODELS = [process.env.GEMINI_MODEL || "gemini-3-flash-preview", ...(process.env.GEMINI_FALLBACK_MODEL || "").split(",")]
  .map((s) => s.trim()).filter(Boolean);
const MAX_TURNS = Number(process.env.MAX_TURNS || 10);
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const validate = ajv.compile(schema as any);
const exhausted = new Map<string, number>(); // model -> time before which we skip it
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class SkipModel extends Error {}

const functionDeclarations = [
  {
    name: "web_search",
    description: "Search the web. Returns result titles, URLs and snippets. If results are empty, probe likely official docs URLs directly with http_probe.",
    parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] },
  },
  {
    name: "http_probe",
    description: "Public, unauthenticated GET or HEAD request. Returns status, content type, redirect location and the first 4 KB of text. Use for docs pages, /.well-known documents and fake-client authorize checks.",
    parameters: {
      type: Type.OBJECT,
      properties: { method: { type: Type.STRING, enum: ["GET", "HEAD"] }, url: { type: Type.STRING } },
      required: ["url"],
    },
  },
];

// Retries temporary errors. A daily quota error or persistent overload moves on to the next model.
async function gen(model: string, params: any) {
  for (let i = 0; i < 5; i++) {
    try { return await ai.models.generateContent({ ...params, model }); }
    catch (e: any) {
      const msg = String(e?.message || e);
      const code = e?.status ?? Number((msg.match(/"code":(\d+)/) || [])[1]);
      if (code === 429 && /PerDay|per day/i.test(msg)) { exhausted.set(model, Date.now() + 6 * 3600e3); throw new SkipModel(`${model}: daily free quota used up`); }
      if (![429, 500, 503, 504].includes(code)) throw e;
      if (i === 4) { exhausted.set(model, Date.now() + 10 * 60e3); throw new SkipModel(`${model}: overloaded`); }
      await sleep(Math.min(60000, 5000 * 2 ** i));
    }
  }
}

// Default search is DuckDuckGo's HTML page: free, no key, no quota.
const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&quot;/g, "'").replace(/\s+/g, " ").trim();

async function ddgSearch(query: string) {
  try {
    const r = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
      headers: { "user-agent": "Mozilla/5.0 (compatible; oauth-guide-bot/1.0)" }, signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();
    const results: any[] = [];
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) && results.length < 8) {
      let url = m[1];
      const u = /uddg=([^&]+)/.exec(url);
      if (u) url = decodeURIComponent(u[1]);
      if (url.startsWith("//")) url = "https:" + url;
      results.push({ title: strip(m[2]), url, snippet: strip(m[3]) });
    }
    if (!results.length) return { results: [], note: "No results (search may be rate limited). Try http_probe on likely official docs URLs directly." };
    return { results };
  } catch (e: any) { return { results: [], note: "Search failed: " + String(e?.message || e) }; }
}

// Optional: SEARCH_PROVIDER=google uses Gemini's Google Search grounding (may need billing).
async function googleSearch(model: string, query: string) {
  const r: any = await gen(model, {
    contents: `Search the web and answer briefly with specifics and official URLs: ${query}`,
    config: { tools: [{ googleSearch: {} }] },
  });
  const sources = (r.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map((c: any) => ({ title: c.web?.title, url: c.web?.uri })).filter((s: any) => s.url);
  return { summary: (r.text || "").slice(0, 3000), sources };
}

const NUDGE = "Stop investigating now. Output the final guide as one JSON object. Mark anything you could not verify as unknown.";

async function runWith(model: string, app: string, onStage: (s: string) => void, cache: Map<string, any>) {
  const contents: any[] = [{ role: "user", parts: [{ text: `App to investigate: ${app}\nToday: ${new Date().toISOString()}` }] }];
  let repaired = false, nudged = false, lastErr = "";
  onStage(`Finding official documentation (${model})`);
  for (let turn = 0; turn <= MAX_TURNS; turn++) {
    const finalPhase = turn >= MAX_TURNS - 2; // drop tools so the model must answer
    if (finalPhase && !nudged) { nudged = true; contents[contents.length - 1].parts.push({ text: NUDGE }); }
    const res: any = await gen(model, {
      contents,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 16000, ...(finalPhase ? {} : { tools: [{ functionDeclarations }] }) },
    });
    const content = res.candidates?.[0]?.content;
    if (content) contents.push(content); // keep as-is so thought signatures are preserved
    const calls = res.functionCalls || [];
    if (calls.length) {
      const parts: any[] = [];
      for (const c of calls) {
        const key = c.name + JSON.stringify(c.args);
        let out = cache.get(key);
        if (!out) {
          if (c.name === "web_search") {
            onStage(`Searching: ${c.args?.query}`);
            const q = String(c.args?.query);
            out = process.env.SEARCH_PROVIDER === "google" ? await googleSearch(model, q).catch(() => ddgSearch(q)) : await ddgSearch(q);
          } else { onStage(`Probing ${c.args?.url}`); out = await httpProbe(c.args as any); }
          cache.set(key, out);
        }
        parts.push({ functionResponse: { name: c.name, id: c.id, response: { result: out } } });
      }
      contents.push({ role: "user", parts });
      continue;
    }
    const text: string = res.text || "";
    try {
      const guide = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      if (validate(guide)) return guide;
      lastErr = ajv.errorsText(validate.errors);
    } catch { lastErr = "Output was not valid JSON"; }
    if (repaired) break;
    repaired = true;
    onStage("Fixing output format");
    contents.push({ role: "user", parts: [{ text: `Your JSON failed validation: ${lastErr}. Return the corrected JSON object only.` }] });
  }
  throw new Error("Could not produce a valid guide: " + lastErr);
}

export async function runAgent(app: string, onStage: (s: string) => void) {
  const cache = new Map<string, any>(); // tool results are reused if a run restarts on another model
  const notes: string[] = [];
  for (const model of MODELS) {
    if ((exhausted.get(model) || 0) > Date.now()) { notes.push(`${model}: skipped (recently out of quota)`); continue; }
    try { return await runWith(model, app, onStage, cache); }
    catch (e: any) {
      if (!(e instanceof SkipModel)) throw e;
      notes.push(e.message);
      onStage(`${e.message}. Trying the next model`);
    }
  }
  throw new Error("No model available. " + notes.join("; ") + ". Free-tier daily quotas reset about once a day; add models to GEMINI_FALLBACK_MODEL or enable billing.");
}