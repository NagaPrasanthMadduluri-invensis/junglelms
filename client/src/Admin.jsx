import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "./adminApi";
import "./assessment.css";
import "./admin.css";

// =====================================================================
// ADMIN DASHBOARD
//
// Three views behind one login:
//   Cohort      cards + the participant table for one phase
//   Participant every answer from one person, marked against the key
//   Comparison  pre → post movement, once both phases have data
// =====================================================================

const PHASE_LABEL = { pre: "Pre-assessment", post: "Post-assessment" };

/** [a,b,c,d] → [[a,b],[c,d]] — the distribution cards sit two to a row. */
const chunk = (xs, n) =>
  xs.reduce((out, x, i) => (i % n ? out[out.length - 1].push(x) : out.push([x]), out), []);

const fmtDate = (ms) =>
  ms ? new Date(ms).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const fmtAgo = (ms) => {
  if (!ms) return "—";
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const STATE_LABEL = { complete: "Complete", partial: "Partial", in_progress: "In progress" };

// =====================================================================
// CARDS
// =====================================================================

function Card({ label, value, sub, tone }) {
  return (
    <div className={"admin-card" + (tone ? ` tone-${tone}` : "")}>
      <div className="admin-card-label">{label}</div>
      <div className="admin-card-value">{value}</div>
      {sub && <div className="admin-card-sub">{sub}</div>}
    </div>
  );
}

function Cards({ stats, assessment }) {
  return (
    <div className="admin-cards">
      <Card label="Participants" value={stats.participants}
            sub={`${stats.submitted} submitted · ${stats.inProgress} still going`} />
      <Card label="Completed" value={stats.complete} tone="pass"
            sub={`${stats.completionRate}% of everyone who started`} />
      <Card label="Partial" value={stats.partial} tone={stats.partial ? "run" : null}
            sub="submitted with unanswered sections" />
      <Card label="In progress" value={stats.inProgress}
            sub="started, not yet submitted" />
      <Card label="Items" value={assessment.itemCount}
            sub={`${assessment.stageCount} stages`} />
    </div>
  );
}

// =====================================================================
// DIMENSIONS + DISTRIBUTIONS
// =====================================================================

function Dimensions({ dimensionMeans }) {
  if (!dimensionMeans.length) return null;
  return (
    <div className="admin-panel">
      <h2>Cohort by dimension</h2>
      <p className="admin-note">
        Auto-scored from the discriminator stage only. Forensics, the hands-on task and the written
        items are graded by hand. Nothing here is summed into a single score.
      </p>
      <div className="admin-bars">
        {dimensionMeans.map((d) => (
          <div className="admin-bar-row" key={d.dimension}>
            <div className="admin-bar-label">{d.dimension}</div>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${d.mean}%` }} />
              <div className="admin-bar-range" style={{ left: `${d.min}%`, width: `${Math.max(1, d.max - d.min)}%` }} />
            </div>
            <div className="admin-bar-value">{d.mean}%</div>
            <div className="admin-bar-meta">range {d.min}–{d.max}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribution({ title, note, data }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  if (!total) return null;
  return (
    <div className="admin-panel">
      <h2>{title}</h2>
      {note && <p className="admin-note">{note}</p>}
      <table className="rev">
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td style={{ width: 140 }}>
                <div className="admin-mini-track">
                  <div className="admin-mini-fill" style={{ width: `${(d.count / total) * 100}%` }} />
                </div>
              </td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================================
// PARTICIPANT TABLE
// =====================================================================

function Participants({ participants, onOpen }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => participants.filter((p) => {
    if (filter !== "all" && p.state !== filter) return false;
    if (query && !`${p.name} ${p.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [participants, filter, query]);

  const dims = [...new Set(participants.flatMap((p) => p.dimensions.map((d) => d.dimension)))].sort();

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Participants</h2>
        <div className="admin-controls">
          <input className="admin-search" placeholder="Search name or email"
                 value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="seg">
            {["all", "complete", "partial", "in_progress"].map((f) => (
              <label key={f}>
                <input type="radio" name="pfilter" checked={filter === f} onChange={() => setFilter(f)} />
                {f === "all" ? "All" : STATE_LABEL[f]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="admin-empty">No participants match.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Progress</th>
                {dims.map((d) => <th key={d} className="num">{d}</th>)}
                <th className="num">Time</th>
                <th className="num">Optional</th>
                <th className="num">Gaps</th>
                <th className="num">Blocked</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} onClick={() => onOpen(p)} tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onOpen(p); }}>
                  <td>
                    <div className="admin-name">{p.name}</div>
                    {p.email && <div className="admin-sub">{p.email}</div>}
                  </td>
                  <td><span className={`admin-pill ${p.state}`}>{STATE_LABEL[p.state]}</span></td>
                  <td>
                    <div className="admin-mini-track" title={`${p.answered} of ${p.totalAnswerable} fields`}>
                      <div className="admin-mini-fill" style={{ width: `${p.progressPct}%` }} />
                    </div>
                    <div className="admin-sub">
                      {p.progressPct}%
                      {/* Under 100% with no gaps means only optional fields were skipped. */}
                      {p.state !== "in_progress" && p.gapCount === 0 && p.progressPct < 100 && (
                        <span className="admin-optnote" title="Every required question was answered; the rest were optional">
                          optional skipped
                        </span>
                      )}
                    </div>
                  </td>
                  {dims.map((d) => {
                    const hit = p.dimensions.find((x) => x.dimension === d);
                    return <td key={d} className="num">{hit ? `${hit.pct}%` : "—"}</td>;
                  })}
                  <td className="num">{p.durationMin ? `${p.durationMin}m` : "—"}</td>
                  <td className="num" title="Optional questions they chose to answer">
                    {p.optionalTotal ? `${p.optionalAnswered}/${p.optionalTotal}` : "—"}
                  </td>
                  <td className="num">{p.gapCount || "—"}</td>
                  <td className="num">{p.blockedCount ? <span className="admin-flag">{p.blockedCount}</span> : "—"}</td>
                  <td className="admin-sub">{fmtAgo(p.completedAt || p.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// ONE PARTICIPANT — every answer, marked
// =====================================================================

function ParticipantView({ id, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showRubrics, setShowRubrics] = useState(false);

  useEffect(() => {
    adminApi.participant(id).then((res) => {
      if (res.error) setError(res.error);
      else setData(res);
    });
  }, [id]);

  if (error) return <div className="admin-panel"><p className="admin-error">{error}</p></div>;
  if (!data) return <div className="admin-panel"><p>Loading…</p></div>;

  const { participant, assessment, answers, dimensions, completeness } = data;
  const gaps = (completeness || []).filter((c) => !c.complete);

  /**
   * What this stage actually scored.
   *
   *   { got, max, pct }  the stage is auto-scored (the discriminators)
   *   "hand"             answered, but graded by hand against the rubric
   *   null               not scored at all (pre-flight, context)
   *
   * `stage.meta` already ends in "· not scored" for the unscored stages, so
   * nothing extra is appended for those — it used to print twice.
   */
  const stageScore = (stage) => {
    if (!stage.scored) return null;
    const marked = (stage.items || [])
      .map((it) => answers[it.ref])
      .filter((a) => a && a.autoScore !== null && a.autoScore !== undefined);
    if (!marked.length) return "hand";
    const got = marked.reduce((sum, a) => sum + a.autoScore, 0);
    return {
      got: Math.round(got * 100) / 100,
      max: marked.length,
      pct: Math.round((got / marked.length) * 100),
    };
  };

  const renderAnswer = (item) => {
    const a = answers[item.ref] || {};

    if (item.kind === "single" || item.kind === "multi") {
      const chosen = Array.isArray(a.value) ? a.value : a.value ? [a.value] : [];
      return (
        <div className="admin-answer">
          {item.options.map((o) => {
            const picked = chosen.includes(o.id);
            const cls = [
              "admin-opt",
              picked ? "picked" : "",
              o.isKey ? "is-key" : "",
              o.isNeutral ? "is-neutral" : "",
              picked && !o.isKey && !o.isNeutral ? "is-wrong" : "",
            ].filter(Boolean).join(" ");
            return (
              <div className={cls} key={o.id}>
                <span className="admin-opt-mark">
                  {picked ? "●" : "○"}{o.isKey ? " ✓" : o.isNeutral ? " ~" : ""}
                </span>
                <span>{o.text}</span>
              </div>
            );
          })}
          <div className="admin-answer-meta">
            {a.autoScore !== null && a.autoScore !== undefined && <span>score {a.autoScore}</span>}
            {a.confidence && <span>confidence {a.confidence}</span>}
            {!chosen.length && <span className="admin-flag">not answered</span>}
          </div>
          {a.justification && (
            <div className="admin-quote"><strong>Their justification:</strong> {a.justification}</div>
          )}
        </div>
      );
    }

    if (item.kind === "forensics") {
      const subs = (item.config && item.config.subs) || [];
      return (
        <div className="admin-answer">
          {subs.map((s) => {
            const sub = answers[`${item.ref}_${s[0]}`] || {};
            return (
              <div className="admin-subanswer" key={s[0]}>
                <div className="admin-sublabel">({s[0]}) {s[1]}</div>
                {sub.value ? <div className="admin-quote">{sub.value}</div>
                           : <div className="admin-flag">not answered</div>}
              </div>
            );
          })}
        </div>
      );
    }

    if (item.kind === "preflight") {
      return (
        <div className="admin-answer">
          {a.blocked ? <span className="admin-flag">BLOCKED</span>
            : a.value ? <code className="admin-inline-code">{a.value}</code>
            : <span className="admin-flag">not answered</span>}
        </div>
      );
    }

    if (item.kind === "band") {
      const v = a.value;
      return (
        <div className="admin-answer admin-band">
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={"admin-band-dot" + (String(v) === String(n) ? " on" : "")}>{n}</span>
          ))}
          {a.confidence && <span className="admin-answer-meta"><span>sure: {a.confidence}</span></span>}
        </div>
      );
    }

    return (
      <div className="admin-answer">
        {a.value ? <div className="admin-quote">{a.value}</div>
                 : <span className="admin-flag">not answered</span>}
      </div>
    );
  };

  return (
    <div>
      <div className="admin-detail-head">
        <button className="btn ghost" onClick={onBack}>← Back to cohort</button>
        <label className="admin-toggle">
          <input type="checkbox" checked={showRubrics} onChange={(e) => setShowRubrics(e.target.checked)} />
          Show marking rubrics
        </label>
      </div>

      <div className="admin-panel">
        <p className="eyebrow">{PHASE_LABEL[participant.phase]}</p>
        <h1 style={{ marginBottom: 6 }}>{participant.name}</h1>
        <p className="admin-sub" style={{ marginBottom: 18 }}>
          {participant.email || "no email given"} ·{" "}
          <span className={`admin-pill ${participant.state}`}>{STATE_LABEL[participant.state]}</span>
          {participant.completedAt && <> · submitted {fmtDate(participant.completedAt)}</>}
        </p>

        {dimensions.length > 0 && (
          <div className="admin-dimstrip">
            {dimensions.map((d) => (
              <div className="admin-dimchip" key={d.dimension}>
                <span className="admin-dimchip-label">{d.dimension}</span>
                <span className="admin-dimchip-value">{d.pct}%</span>
                <span className="admin-dimchip-raw">{d.raw}/{d.n}</span>
              </div>
            ))}
          </div>
        )}

        {gaps.length > 0 && (
          <div className="note warn" style={{ marginTop: 18 }}>
            <strong>Unanswered</strong>
            <p style={{ marginBottom: 0 }}>{gaps.map((g) => `${g.label} (${g.detail})`).join(" · ")}</p>
          </div>
        )}
      </div>

      {(assessment.stages || []).map((stage) => (
        <div className="admin-panel" key={stage.key}>
          <div className="admin-stage-head">
            <h2>{stage.name}</h2>
            {(() => {
              const sc = stageScore(stage);
              if (sc && sc !== "hand") {
                return (
                  <span className="admin-stage-score">
                    <strong>{sc.got} / {sc.max}</strong>
                    <span className="admin-stage-pct">{sc.pct}%</span>
                  </span>
                );
              }
              return (
                <span className="admin-sub">
                  {stage.meta}{sc === "hand" ? " · graded by hand" : ""}
                </span>
              );
            })()}
          </div>
          {(stage.items || []).map((item) => (
            <div className="admin-item" key={item.ref}>
              <div className="admin-item-head">
                <span className="qid">{item.ref}</span>
                <div className="admin-item-stem">{item.stem}</div>
                {item.dim && <span className="admin-dimtag">{item.dim}</span>}
              </div>
              {renderAnswer(item)}
              {showRubrics && (item.rubrics || []).length > 0 && (
                <div className="key">
                  <div className="kh">Marking · {item.ref}</div>
                  {item.rubrics.map((r, i) => (
                    <div key={i} className="admin-rubric">
                      {r.ref && <strong>{r.ref}</strong>}{" "}
                      {r.label && <span>{r.label} </span>}
                      {r.weight && <span className="admin-weight">w{r.weight}</span>}
                      {r.detail && <div>{r.detail}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// =====================================================================
// COMPARISON
// =====================================================================

/** A pre → post cell: the two scores, with the movement carrying the colour. */
function Move({ pre, post, change, suffix = "%" }) {
  if (pre === null || pre === undefined || post === null || post === undefined) {
    return <td className="num cmp-cell"><span className="cmp-none">—</span></td>;
  }
  return (
    <td className="num cmp-cell">
      <span className="cmp-pair">{pre}{suffix} <span className="cmp-arrow">→</span> {post}{suffix}</span>
      <span className={"cmp-delta " + (change > 0 ? "up" : change < 0 ? "down" : "flat")}>
        {change > 0 ? "+" : ""}{change}
      </span>
    </td>
  );
}

function Comparison({ comparison }) {
  if (!comparison || !comparison.available) {
    return (
      <div className="admin-panel admin-locked">
        <h2>Pre → post comparison</h2>
        <p>
          This opens once the same people have submitted both phases. They are
          matched on the email they signed in with, so the name each person
          types does not have to match between the two sittings.
        </p>
        <div className="admin-lockrow">
          <span><strong>{comparison ? comparison.preCount : 0}</strong> pre submissions</span>
          <span><strong>{comparison ? comparison.postCount : 0}</strong> post submissions</span>
          <span><strong>{comparison ? comparison.pairedCount : 0}</strong> matched pairs</span>
        </div>
        {comparison && comparison.onlyPost && comparison.onlyPost.length > 0 && (
          <p className="admin-note" style={{ marginTop: 12 }}>
            Sat the post with no pre on record: {comparison.onlyPost.join(", ")}
          </p>
        )}
        {comparison && comparison.onlyPre && comparison.onlyPre.length > 0 && (
          <p className="admin-note" style={{ marginTop: 4 }}>
            Sat the pre, no post yet: {comparison.onlyPre.length} {comparison.onlyPre.length === 1 ? "person" : "people"}.
          </p>
        )}
      </div>
    );
  }

  const c = comparison;
  const dims = c.dimensions || [];

  return (
    <>
      <div className="admin-cards">
        <Card label="Matched pairs" value={c.pairedCount}
              sub={`of ${c.preCount} pre and ${c.postCount} post submissions`} />
        <Card label="Mean movement" value={(c.meanChange > 0 ? "+" : "") + c.meanChange}
              tone={c.meanChange > 0 ? "pass" : c.meanChange < 0 ? "run" : null}
              sub="percentage points, averaged over the matched people" />
        <Card label="Improved" value={c.improved} tone="pass"
              sub={`${c.unchanged} unchanged · ${c.declined} lower`} />
      </div>

      <div className="admin-panel">
        <h2>Movement by dimension</h2>
        <p className="admin-note">
          Cohort mean across the {c.pairedCount} {c.pairedCount === 1 ? "person" : "people"} who
          sat both. Each dimension is scored on its own; nothing is summed into a single score.
        </p>
        <table className="admin-table">
          <thead>
            <tr><th>Dimension</th><th className="num">Pre</th><th className="num">Post</th><th className="num">Change</th></tr>
          </thead>
          <tbody>
            {c.byDimension.map((d) => (
              <tr key={d.dimension}>
                <td>{d.dimension}</td>
                <td className="num">{d.preMean}%</td>
                <td className="num">{d.postMean}%</td>
                <td className={"num " + (d.change > 0 ? "up" : d.change < 0 ? "down" : "")}>
                  {d.change > 0 ? "+" : ""}{d.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-panel">
        <h2>Scores by person, pre → post</h2>
        <p className="admin-note">
          Every dimension for every matched person. The average is the mean of that
          person’s dimensions and exists only to order this table — it is not a
          score anyone is given.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table cmp-table">
            <thead>
              <tr>
                <th>Person</th>
                {dims.map((d) => <th key={d} className="num">{d}</th>)}
                <th className="num">Average</th>
                <th className="num">Self-rating</th>
              </tr>
            </thead>
            <tbody>
              {c.people.map((p) => (
                <tr key={p.email || p.name}>
                  <td>
                    <div className="cmp-name">{p.name}</div>
                    {p.email && <div className="cmp-mail">{p.email}</div>}
                  </td>
                  {dims.map((d) => {
                    const cell = p.dimensions.find((x) => x.dimension === d) || {};
                    return <Move key={d} pre={cell.pre} post={cell.post} change={cell.change} />;
                  })}
                  <Move pre={p.preAvg} post={p.postAvg} change={p.change} />
                  <Move pre={p.selfMap.pre} post={p.selfMap.post} change={p.selfMap.change} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(c.onlyPre.length > 0 || c.onlyPost.length > 0) && (
          <div className="admin-note" style={{ marginTop: 14 }}>
            {c.onlyPre.length > 0 && (
              <p style={{ margin: "0 0 4px" }}>
                Pre only, no post yet: {c.onlyPre.join(", ")}
              </p>
            )}
            {c.onlyPost.length > 0 && (
              <p style={{ margin: 0 }}>
                Post only, no pre on record: {c.onlyPost.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// =====================================================================
// SHELL
// =====================================================================

export default function Admin({ admin, onExit, onSignedOut }) {
  const [phase, setPhase] = useState("pre");
  const [tab, setTab] = useState("cohort");
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    adminApi.overview(phase).then((res) => {
      // A session that expired mid-visit drops straight back to the assessment.
      if (res.error) { setError(res.error); if (res.status === 401) onSignedOut(); }
      else setData(res);
    });
  };

  useEffect(() => { load(); }, [phase]);

  const seededPhases = data ? data.phases : [];

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="admin-top-left">
          <img src="/logo-white.svg" alt="Edstellar" className="admin-logo" />
          <div>
            <div className="admin-top-title">
              {PHASE_LABEL[phase]} · Applied MLOps on Databricks and Azure DevOps
            </div>
            <div className="admin-top-sub">Bechtel · cohort dashboard</div>
          </div>
        </div>
        <div className="admin-top-right">
          <button className="chip" onClick={onExit}>← Assessment</button>
          <span className="admin-user">{admin.displayName || admin.username}</span>
          <button className="chip" onClick={async () => { await adminApi.logout(); onSignedOut(); }}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {seededPhases.map((p) => (
          <button key={p.phase}
                  className={"admin-tab" + (phase === p.phase && tab === "cohort" ? " on" : "")}
                  disabled={!p.seeded}
                  title={p.seeded ? "" : "not seeded yet"}
                  onClick={() => { setPhase(p.phase); setTab("cohort"); setOpenId(null); }}>
            {PHASE_LABEL[p.phase]}
            {!p.seeded && <span className="admin-tab-note">not open</span>}
          </button>
        ))}
        <button className={"admin-tab" + (tab === "comparison" ? " on" : "")}
                onClick={() => { setTab("comparison"); setOpenId(null); }}>
          Pre → post
          {data && data.comparison && !data.comparison.available && <span className="admin-tab-note">locked</span>}
        </button>
        <div className="admin-tab-spacer" />
        <a className="btn ghost" href={adminApi.exportUrl("cohort", phase)}>Export cohort CSV</a>
        <a className="btn ghost" href={adminApi.exportUrl("responses", phase)}>Export all answers</a>
      </nav>

      <main className="admin-main">
        {error && <div className="admin-error">{error}</div>}
        {!data && !error && <p>Loading…</p>}

        {data && openId && (
          <ParticipantView id={openId} onBack={() => setOpenId(null)} />
        )}

        {data && !openId && tab === "comparison" && (
          <Comparison comparison={data.comparison} />
        )}

        {data && !openId && tab === "cohort" && (
          <>
            {!data.assessment.seeded ? (
              <div className="admin-panel admin-locked">
                <h2>{PHASE_LABEL[phase]} is not open yet</h2>
                <p>
                  This assessment has not been published. Results will appear here once it is live
                  and participants start submitting.
                </p>
              </div>
            ) : (
              <>
                <Cards stats={data.stats} assessment={data.assessment} />
                <Dimensions dimensionMeans={data.stats.dimensionMeans} />
                <Participants participants={data.participants} onOpen={(p) => setOpenId(p.id)} />
                {/* The pre and post instruments ask different context
                    questions, so the server names these per phase. */}
                {chunk(data.stats.distributions || [], 2).map((pair, i) => (
                  <div className="admin-two-up" key={i}>
                    {pair.map((d) => (
                      <Distribution key={d.title} title={d.title} note={d.note} data={d.data} />
                    ))}
                  </div>
                ))}
                {data.stats.calibration.length > 0 && (
                  <div className="admin-panel">
                    <h2>Calibration index</h2>
                    <p className="admin-note">
                      Self-rating minus measured result. Positive means they rate themselves above where
                      the assessment placed them. Used for pacing and pairing — never described to the
                      client as overconfidence.
                    </p>
                    <table className="admin-table">
                      <tbody>
                        {data.stats.calibration.map((c) => (
                          <tr key={c.name}>
                            <td>{c.name}</td>
                            <td className="num">
                              <span className={c.delta >= 15 ? "up" : c.delta <= -15 ? "down" : ""}>
                                {c.delta > 0 ? "+" : ""}{c.delta}
                              </span>
                            </td>
                            <td className="admin-sub">
                              {c.delta >= 15 ? "expect resistance at the first lab that contradicts the self-image"
                                : c.delta <= -15 ? "often the strongest in the room — pair as a driver early"
                                : "well calibrated"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
