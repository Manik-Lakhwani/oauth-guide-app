import dns from "node:dns/promises";
import net from "node:net";

const last = new Map<string, number>();

function isPrivate(ip: string) {
  if (net.isIPv6(ip)) return ip === "::1" || /^(fc|fd|fe80|::ffff:)/i.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// Public, unauthenticated GET/HEAD only. Never follows redirects; reports them instead.
export async function httpProbe(input: { method?: string; url: string }) {
  const method = (input.method || "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(method)) return { error: "Only GET and HEAD are allowed" };
  let u: URL;
  try { u = new URL(input.url); } catch { return { error: "Invalid URL" }; }
  if (!["http:", "https:"].includes(u.protocol)) return { error: "Only http(s) URLs are allowed" };
  try {
    const addrs = await dns.lookup(u.hostname, { all: true });
    if (addrs.some((a) => isPrivate(a.address))) return { error: "Blocked: private address" };
  } catch { return { error: "DNS lookup failed" }; }
  const wait = 500 - (Date.now() - (last.get(u.hostname) || 0));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last.set(u.hostname, Date.now());
  try {
    const r = await fetch(u, {
      method, redirect: "manual", signal: AbortSignal.timeout(10000),
      headers: { "user-agent": "oauth-guide-bot/1.0 (public read-only probe)" },
    });
    const ct = r.headers.get("content-type") || "";
    let body = method === "HEAD" ? "" : (await r.text()).slice(0, 200000);
    if (ct.includes("html")) body = body.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    return { status: r.status, content_type: ct, location: r.headers.get("location"), body: body.slice(0, 4000) };
  } catch (e: any) { return { error: String(e?.message || e) }; }
}
