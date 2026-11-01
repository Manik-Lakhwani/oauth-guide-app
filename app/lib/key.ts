// Turns "GitHub", "github.com" or "https://www.github.com/x" into the same key: "github".
export function normKey(input: string) {
  const s = input.trim().toLowerCase();
  if (!/\s/.test(s)) {
    try {
      const host = new URL(/^https?:\/\//.test(s) ? s : "https://" + s).hostname.replace(/^www\./, "");
      if (host.includes(".")) { const p = host.split("."); return p[p.length - 2].replace(/[^a-z0-9]/g, ""); }
    } catch {}
  }
  return s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
