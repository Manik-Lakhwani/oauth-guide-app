import Link from "next/link";
import Generator from "../components/Generator";
import { listLibrary } from "../lib/library";

export default function Home() {
  const lib = listLibrary();
  return (
    <main>
      <h1>OAuth app setup guides</h1>
      <p className="muted">What it takes to create an OAuth app with a provider and get it approved: difficulty, time, blockers, and what an agent can do for you versus what you must do.</p>
      <Generator library={lib.map((g: any) => ({ id: g.id, name: g.app.name, difficulty: g.summary.difficulty }))} />
      <h2>Library</h2>
      {lib.length === 0 && <p className="muted">No library guides yet. Run <code>npm run seed -- GitHub Slack</code>, review the JSON, then redeploy.</p>}
      <div className="cards">{lib.map((g: any) => (
        <Link key={g.id} href={`/guide/${g.id}`} className="card"><b>{g.app.name}</b><span>{g.summary.difficulty} · wait: {g.summary.approval_wait.label}</span></Link>
      ))}</div>
    </main>
  );
}
