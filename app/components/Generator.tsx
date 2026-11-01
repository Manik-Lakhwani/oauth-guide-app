"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { normKey } from "../lib/key";

type Item = { id: string; name: string; difficulty: string };

export default function Generator({ library }: { library: Item[] }) {
  const [app, setApp] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const q = app.trim().toLowerCase(), key = normKey(app);
  const matches = q.length < 2 ? [] : library.filter((g) => g.name.toLowerCase().includes(q) || g.id.includes(key) || (key && key.includes(g.id)));
  const exact = matches.find((g) => g.id === key);

  async function go(force: boolean) {
    setBusy(true); setErr(""); setStages([]);
    const res = await fetch("/api/generate", { method: "POST", body: JSON.stringify({ app, force }) });
    if (!res.ok || !res.body) { setErr(await res.text()); setBusy(false); return; }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const l of lines.filter(Boolean)) {
        const m = JSON.parse(l);
        if (m.type === "stage") setStages((s) => [...s, m.text]);
        if (m.type === "error") setErr(m.text);
        if (m.type === "done") { router.push(`/guide/${m.id}`); return; }
      }
    }
    setBusy(false);
  }

  return (
    <section className="gen">
      <form onSubmit={(e) => { e.preventDefault(); go(false); }}>
        <input value={app} onChange={(e) => setApp(e.target.value)} placeholder="App name or website, e.g. Shopify or https://asana.com" disabled={busy} />
        <button disabled={busy || app.trim().length < 2}>{busy ? "Working..." : exact ? "Open guide" : "Generate guide"}</button>
        {exact && !busy && <button type="button" className="alt" onClick={() => go(true)}>Regenerate</button>}
      </form>
      {matches.length > 0 && !busy && (
        <div className="matches">Already in the library: {matches.map((g) => <a key={g.id} href={`/guide/${g.id}`}>{g.name} ({g.difficulty})</a>)}</div>
      )}
      {stages.length > 0 && <ul className="stages">{stages.map((s, i) => <li key={i}>{s}</li>)}</ul>}
      {err && <p className="err">{err}</p>}
    </section>
  );
}
