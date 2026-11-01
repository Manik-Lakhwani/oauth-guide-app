const COLORS: any = { tested: "#0a7d4f", official: "#1560bd", community: "#b8600a", inferred: "#6b7280", unknown: "#b91c1c" };

export default function GuideView({ g }: { g: any }) {
  const ev: any = Object.fromEntries((g.evidence || []).map((e: any) => [e.id, e]));
  const Ev = ({ ids }: { ids?: string[] }) => (
    <>{(ids || []).map((i) => ev[i] && (
      <a key={i} className="badge" style={{ background: COLORS[ev[i].tag] }} title={ev[i].claim} href={ev[i].source_url || `#ev-${i}`} target="_blank">{ev[i].tag}</a>
    ))}</>
  );
  const s = g.summary;
  return (
    <article>
      <h1>{g.app.name}: OAuth app setup</h1>
      <p className="muted">Generated {g.app.generated_at?.slice(0, 10)} · <a href={g.app.developer_docs_url || "#"}>official docs</a></p>
      <p className="headline">{s.headline}</p>
      <div className="glance">
        <div><span>Difficulty</span><b>{s.difficulty}</b></div>
        <div><span>Setup effort</span><b>{s.setup_effort.estimate}</b><Ev ids={s.setup_effort.evidence_ids} /></div>
        <div><span>Approval wait</span><b>{s.approval_wait.label}</b><Ev ids={s.approval_wait.evidence_ids} /></div>
        <div><span>Start today?</span><b>{s.can_start_today.answer}</b><small>{s.can_start_today.reason}</small></div>
        <div><span>Confidence</span><b>{s.confidence.level}</b><small>{s.confidence.reason}</small></div>
      </div>
      <p className="muted">Type: {s.type}{s.type_note ? ` (${s.type_note})` : ""}. Scoring: {s.difficulty_factors.map((f: any) => `${f.factor} ${f.score}/2`).join(", ")}.</p>

      <h2>What could block you</h2>
      {g.blockers.map((b: any, i: number) => (
        <div key={i} className="item"><b>{b.title}</b> <em>{b.severity.replace(/_/g, " ")}</em> <Ev ids={b.evidence_ids} /><p>{b.detail}{b.workaround ? ` Workaround: ${b.workaround}` : ""}</p></div>
      ))}

      <h2>Steps</h2>
      {g.steps.map((st: any) => (
        <div key={st.order} className="item">
          <b>{st.order}. {st.title}</b> <em className={`who ${st.owner}`}>{st.owner.replace("_", " ")} · {st.agent_status.replace(/_/g, " ")}</em> <Ev ids={st.evidence_ids} />
          <p>{st.action}{st.url && <> <a href={st.url} target="_blank">Open</a></>}</p>
          {(st.fields || []).map((f: any, i: number) => <p key={i} className="field"><code>{f.name}</code> {f.guidance}</p>)}
          {st.why_human_only && <p className="muted">Why you: {st.why_human_only}</p>}
        </div>
      ))}

      <h2>Scopes</h2>
      <table><thead><tr><th>Scope</th><th>Purpose</th><th>Extra review?</th><th>Source</th></tr></thead><tbody>
        {g.scopes.map((sc: any, i: number) => <tr key={i}><td><code>{sc.scope}</code></td><td>{sc.purpose}</td><td>{sc.triggers_extra_review}</td><td><Ev ids={sc.evidence_ids} /></td></tr>)}
      </tbody></table>

      <h2>If you get stuck</h2>
      {g.if_stuck.common_rejection_reasons.map((r: any, i: number) => <div key={i} className="item"><b>{r.reason}</b> <Ev ids={r.evidence_ids} /><p>{r.fix}</p></div>)}
      <p>{g.if_stuck.contacts.map((c: any, i: number) => <a key={i} href={c.url} target="_blank">{c.label} </a>)}</p>
      <p><b>Message template:</b> {g.if_stuck.message_template.subject}</p>
      <pre>{g.if_stuck.message_template.body}</pre>

      <h2>Agent vs. you</h2>
      <div className="two">
        <div><h3>The agent did</h3><ul>{g.agent_vs_you.agent_did.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul><h3>Can do next</h3><ul>{g.agent_vs_you.agent_can_do_next.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
        <div><h3>You must</h3><ul>{g.agent_vs_you.you_must.map((x: any, i: number) => <li key={i}>{x.task}<small> {x.reason}</small></li>)}</ul></div>
      </div>

      <h2>What was tested</h2>
      <table><thead><tr><th>ID</th><th>Check</th><th>Result</th><th>Observed</th></tr></thead><tbody>
        {g.tests.map((t: any) => <tr key={t.id}><td>{t.id}</td><td>{t.description}</td><td>{t.result.replace(/_/g, " ")}</td><td>{t.observed}</td></tr>)}
      </tbody></table>

      <h2>What is still unknown</h2>
      {g.unknowns.map((u: any, i: number) => <div key={i} className="item"><b>{u.question}</b><p>{u.why_unknown} To resolve: {u.how_to_resolve}</p></div>)}

      <h2>Evidence log</h2>
      <ol className="evlog">{g.evidence.map((e: any) => (
        <li key={e.id} id={`ev-${e.id}`}><span className="badge" style={{ background: COLORS[e.tag] }}>{e.tag}</span> {e.id}: {e.claim} {e.source_url && <a href={e.source_url} target="_blank">source</a>}</li>
      ))}</ol>
    </article>
  );
}
