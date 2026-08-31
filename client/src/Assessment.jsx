import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import AdminLogin from "./AdminLogin";
import { cleanText, hasContent } from "./sanitize";
import { validateScreen, subRefs } from "./validate";
import "./assessment.css";
import "./admin.css";   // sidebar admin button + sign-in modal

// =====================================================================
// Stage-driven assessment engine.
//
// Nothing here is content. Stages, items, options and copy all come from
// /api/assessment/:phase; this file only knows how to render each stage
// KIND and how to enforce the navigation rules attached to it.
//
// Two rules from the instrument are load-bearing and implemented here:
//   · a one-way stage cannot be re-entered, and its items are one per screen
//   · option order is shuffled per item, with the order held stable for the
//     sitting so a resume does not reshuffle underneath the participant
// =====================================================================

const CONF_DEFAULT = ["Low", "Medium", "High"];

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const letter = (i) => String.fromCharCode(65 + i);

/** Deterministic shuffle, seeded per item so a resume keeps the same order. */
function seededOrder(n, seed) {
  const order = [...Array(n).keys()];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  let s = Math.abs(h) || 1;
  const rand = () => ((s = (Math.imul(1103515245, s) + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Flatten stages into the screen sequence, splitting one-per-screen stages. */
function buildScreens(assessment) {
  const screens = [
    { key: "welcome", stageIdx: null },
    { key: "ident", stageIdx: null },
  ];
  assessment.stages.forEach((stage, idx) => {
    if (stage.onePerScreen && stage.items.length) {
      stage.items.forEach((item, i) =>
        screens.push({ key: `${stage.key}-${i}`, stageIdx: idx, stage, item, itemNo: i })
      );
    } else {
      screens.push({ key: stage.key, stageIdx: idx, stage });
    }
  });
  screens.push({ key: "done", stageIdx: assessment.stages.length - 1 });
  return screens;
}

/**
 * These two MUST stay at module scope.
 *
 * Declared inside Assessment(), their function identity changed on every
 * render, so React treated each keystroke as a new component type and
 * unmounted/remounted the <textarea> — losing focus after one character.
 */
function TextArea({ value, rows = 4, placeholder = "", onChange, invalid = false }) {
  const v = typeof value === "string" ? value : "";
  const n = words(v);
  return (
    <>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={v}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="count">{n} {n === 1 ? "word" : "words"}</div>
    </>
  );
}

function Confidence({ name, choices, value, onChange }) {
  const opts = choices && choices.length ? choices : CONF_DEFAULT;
  return (
    <div className="conf">
      <span className="lbl">Confidence in this answer</span>
      <div className="seg">
        {opts.map((x) => (
          <label key={x}>
            <input
              type="radio"
              name={`${name}-conf`}
              value={x}
              checked={value === x}
              onChange={() => onChange(x)}
            />
            {x}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Assessment({ admin, onAdminSignedIn, onOpenAdmin }) {
  const [phase, setPhase] = useState("pre");
  const [assessment, setAssessment] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [restored, setRestored] = useState(false);
  const [resumeBlocked, setResumeBlocked] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  // Roster check: null = not checked, "checking", "ok", or an error message.
  const [emailState, setEmailState] = useState(null);

  const startedAt = useRef(Date.now());
  const stageTimes = useRef({});
  const stageEnter = useRef({});
  const visited = useRef(new Set());
  const mainRef = useRef(null);

  // ---- load content ------------------------------------------------

  useEffect(() => {
    let live = true;
    setAssessment(null);
    setLoadError(null);
    api.getAssessment(phase).then((res) => {
      if (!live) return;
      if (res.error) setLoadError(res.error);
      else setAssessment(res.assessment);
    });
    return () => { live = false; };
  }, [phase]);

  // ---- resume ------------------------------------------------------

  useEffect(() => {
    if (!assessment || restored) return;
    (async () => {
      const { ok, data: saved } = await api.getSession();
      if (!ok) {
        // The read failed. Stay read-only rather than risk clobbering a saved
        // sitting with an empty one.
        setResumeBlocked(true);
        setToast("Could not reach the server — your answers are not being saved");
        return;
      }
      // Only announce a resume when there is actual progress to resume —
      // a freshly-created empty session is not a resume.
      const hasProgress = saved && saved.answers &&
        (Object.keys(saved.answers).length > 0 || (saved.idx || 0) > 1 || (saved.name || "").trim());
      if (saved && saved.phase === phase && hasProgress) {
        setAnswers(saved.answers || {});
        setName(saved.name || "");
        setEmail(saved.email || "");
        stageTimes.current = saved.stageTimes || {};
        visited.current = new Set(saved.visited || []);
        startedAt.current = saved.startedAt || Date.now();
        if (typeof saved.idx === "number") setIdx(saved.idx);
        setToast("Resumed where you left off");
      }
      setRestored(true);
    })();
  }, [assessment, phase, restored]);

  const screens = useMemo(() => (assessment ? buildScreens(assessment) : []), [assessment]);
  const screen = screens[idx];
  const stage = screen && screen.stage;
  const nameOk = hasContent(name);
  const emailOk = emailState === "ok";

  // Re-checking is required whenever the address changes.
  const onEmailChange = (v) => {
    setEmail(v);
    setEmailState(null);
  };

  /**
   * Verify the address against the cohort roster. Runs on Continue and on
   * blur, so someone is told immediately rather than after 45 minutes.
   */
  async function checkEmail() {
    const value = cleanText(email);
    if (!value) { setEmailState("An email address is required."); return false; }
    setEmailState("checking");
    const res = await api.verifyParticipant(value);
    if (res.ok) {
      setEmail(res.email);        // store the roster's canonical spelling
      setEmailState("ok");
      return true;
    }
    setEmailState(res.error || "This email is not registered for this assessment.");
    return false;
  }

  // ---- persist -----------------------------------------------------

  useEffect(() => {
    if (!assessment || !restored || submitted || resumeBlocked) return;
    api.setSession({
      phase, idx, answers, name, email,
      startedAt: startedAt.current,
      stageTimes: stageTimes.current,
      visited: [...visited.current],
    });
  }, [assessment, restored, submitted, resumeBlocked, phase, idx, answers, name, email]);

  // ---- clocks ------------------------------------------------------

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [idx]);

  // ---- answers -----------------------------------------------------

  const A = (ref) => answers[ref] || {};
  const put = (ref, patch) =>
    setAnswers((prev) => ({ ...prev, [ref]: { ...(prev[ref] || {}), ...patch } }));

  // Stable identities: the clock re-renders this component every second, and
  // the modal must not see new props on every tick.
  const closeAdmin = useCallback(() => setAdminOpen(false), []);
  const signedInAdmin = useCallback((who) => {
    setAdminOpen(false);
    onAdminSignedIn(who);
  }, [onAdminSignedIn]);

  /** Name, then a roster-checked email, then on to the assessment. */
  async function identContinue() {
    if (!nameOk) { setShowErrors(true); return; }
    if (!emailOk && !(await checkEmail())) { setShowErrors(true); return; }
    setShowErrors(false);
    go(idx + 1);
  }

  // ---- navigation --------------------------------------------------

  function go(next) {
    if (next < 0 || next >= screens.length) return;

    // Accumulate time against the stage being left.
    const cur = screens[idx];
    if (cur && cur.stageIdx !== null) {
      const enter = stageEnter.current[cur.stageIdx] || Date.now();
      stageTimes.current[cur.stageIdx] = (stageTimes.current[cur.stageIdx] || 0) + (Date.now() - enter);
    }
    const dest = screens[next];
    if (dest && dest.stageIdx !== null) {
      stageEnter.current[dest.stageIdx] = Date.now();
      visited.current.add(dest.stageIdx);
    }
    setIdx(next);
  }

  // Back is refused out of, and within, a one-way stage.
  function canGoBack() {
    if (idx <= 0) return false;
    const prev = screens[idx - 1];
    if (stage && stage.oneWay) return false;
    if (prev && prev.stage && prev.stage.oneWay) return false;
    return true;
  }

  const screenOfStage = (stageIdx) => screens.findIndex((s) => s.stageIdx === stageIdx);

  // ---- required-answer validation ------------------------------------
  // The rules live in ./validate.js so they can be tested without a browser.

  const filled = hasContent;
  const validate = (scr) => validateScreen(scr, { answers, name, email });

  // Recomputed live once errors are on screen, so they clear as fields are filled.
  const errors = useMemo(
    () => (showErrors ? validate(screen) : {}),
    [showErrors, screen, answers, name, email]
  );
  const errorCount = Object.keys(errors).length;
  const err = (ref) => errors[ref];

  /** Continue, but only when this screen is complete. */
  function tryAdvance(next) {
    const found = validate(screen);
    if (Object.keys(found).length > 0) {
      setShowErrors(true);
      // Put the first unanswered question in view.
      requestAnimationFrame(() => {
        const el = document.querySelector("[data-err]");
        if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    setShowErrors(false);
    go(next);
  }

  // A new screen starts clean.
  useEffect(() => { setShowErrors(false); }, [idx]);

  // ---- completeness (mirrors the server's rules) ---------------------

  const completeness = useMemo(() => {
    if (!assessment) return [];
    const rows = [];
    rows.push({ label: "Name", detail: "so the right pre-work reaches you", complete: filled(name) });

    for (const s of assessment.stages) {
      const items = s.items || [];
      if (!items.length) continue;
      if (s.kind === "preflight") {
        const done = items.filter((i) => filled(A(i.ref).value) || A(i.ref).blocked).length;
        rows.push({ label: s.name, detail: `${done} of ${items.length} confirmed or marked blocked`, complete: done === items.length });
      } else if (s.kind === "selfmap") {
        const bands = items.filter((i) => i.kind === "band");
        const done = bands.filter((i) => filled(A(i.ref).value)).length;
        rows.push({ label: s.name, detail: `${done} of ${bands.length} placed`, complete: done === bands.length });
      } else if (s.kind === "discriminators") {
        const done = items.filter((i) => (A(i.ref).value || []).length > 0).length;
        rows.push({ label: s.name, detail: `${done} of ${items.length} answered`, complete: done === items.length });
      } else if (s.kind === "forensics") {
        for (const item of items) {
          const subs = (item.config && item.config.subs) || [];
          const done = subs.filter((x) => filled(A(`${item.ref}_${x[0]}`).value)).length;
          rows.push({ label: `Forensics ${item.ref}`, detail: `${done} of ${subs.length} parts answered`, complete: done === subs.length });
        }
      } else if (s.kind === "handson") {
        const ids = items.filter((i) => i.kind === "identifier");
        const done = ids.filter((i) => filled(A(i.ref).value)).length;
        const note = items.find((i) => i.kind === "text" && /blocked/i.test(i.ref));
        const excused = note && filled(A(note.ref).value);
        rows.push({ label: s.name, detail: `${done} of ${ids.length} identifiers, or a reason recorded`, complete: done === ids.length || !!excused });
      } else if (s.kind === "written") {
        const done = items.filter((i) => filled(A(i.ref).value)).length;
        rows.push({ label: s.name, detail: items.map((i) => i.ref).join(" and "), complete: done === items.length });
      } else if (s.kind === "context") {
        const done = items.filter((i) => filled(A(i.ref).value)).length;
        rows.push({ label: s.name, detail: `${done} of ${items.length} answered`, complete: done === items.length });
      }
    }
    return rows;
  }, [assessment, answers, name]);

  // ---- submit ------------------------------------------------------

  async function submit() {
    setSubmitting(true);
    // Clean before sending: the server sanitises too, but there is no reason
    // to ship whitespace-only values over the wire at all.
    const cleaned = {};
    for (const [ref, a] of Object.entries(answers)) {
      const value = Array.isArray(a.value) ? a.value : cleanText(a.value);
      const entry = {
        value,
        confidence: cleanText(a.confidence),
        justification: cleanText(a.justification),
        blocked: !!a.blocked,
      };
      if (hasContent(value) || entry.blocked || entry.confidence || entry.justification) {
        cleaned[ref] = entry;
      }
    }

    const payload = {
      participantName: cleanText(name),
      participantEmail: cleanText(email),
      phase,
      startedAt: startedAt.current,
      stageTimes: Object.fromEntries(
        Object.entries(stageTimes.current).map(([k, v]) => [k, Math.round(v / 1000)])
      ),
      answers: cleaned,
    };
    const res = await api.submitAttempt(payload);
    setSubmitting(false);
    if (res.error) {
      setToast(res.error);
      // An address the roster will not accept can only be fixed on the
      // identity screen — including an admin address, which cannot sit the
      // assessment at all.
      if (res.code === "not_registered" || res.code === "admin_account") {
        setEmailState(res.error);
        go(1);
      }
      return;
    }
    setSubmitted(res.attempt);
    await api.deleteSession();
    go(screens.length - 1);
  }

  // ---- export ------------------------------------------------------

  function flatten() {
    const out = [];
    const stamp = new Date().toISOString();
    const add = (item, response, confidence) =>
      out.push({ item, response: response ?? "", confidence: confidence ?? "", recorded: stamp });

    assessment.stages.forEach((s, si) => {
      const tag = `M${si}`;
      (s.items || []).forEach((item, ii) => {
        const a = A(item.ref);
        if (item.kind === "preflight") {
          add(`${tag}.${ii + 1} ${item.stem}`, (a.blocked ? "BLOCKED — " : "") + (a.value || ""));
        } else if (item.kind === "single" || item.kind === "multi") {
          const chosen = (a.value || [])
            .map((id) => item.options.findIndex((o) => o.id === id))
            .filter((n) => n >= 0)
            .map(letter)
            .sort()
            .join("+");
          add(`${tag}.${item.ref}`, chosen, a.confidence || "");
          if (item.config && item.config.justify) {
            add(`${tag}.${item.ref}.justification`, a.justification || "");
          }
        } else if (item.kind === "forensics") {
          ((item.config && item.config.subs) || []).forEach((sub) =>
            add(`${tag}.${item.ref}(${sub[0]})`, A(`${item.ref}_${sub[0]}`).value)
          );
        } else {
          add(`${tag}.${item.ref}`, a.value, a.confidence || "");
        }
      });
    });
    assessment.stages.forEach((s, si) =>
      add(`TIME.${s.name}`, Math.round((stageTimes.current[si] || 0) / 1000) + "s")
    );
    return out;
  }

  function exportAll(kind) {
    const rows = flatten();
    const who = (name || "unnamed-participant").trim();
    const slug = who.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
    let body, filename, type;

    if (kind === "csv") {
      // A leading =, +, - or @ makes a spreadsheet treat the cell as a formula.
      const q = (v) => {
        let t = String(v);
        if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
        return '"' + t.replace(/"/g, '""').replace(/\r?\n/g, " ⏎ ") + '"';
      };
      body =
        "participant,item,response,confidence,recorded\n" +
        rows.map((r) => [q(who), q(r.item), q(r.response), q(r.confidence), q(r.recorded)].join(",")).join("\n");
      filename = `${phase}-assessment-${slug}.csv`;
      type = "text/csv";
    } else {
      body =
        `${phase.toUpperCase()}-ASSESSMENT RESPONSES · ${assessment.subtitle}\n` +
        `Participant: ${who}  ${email}\n` +
        `Exported ${new Date().toString()}\n` +
        "".padEnd(72, "=") + "\n\n" +
        rows.map((r) => r.item + "\n" + (r.confidence ? `[confidence: ${r.confidence}] ` : "") + (r.response || "—") + "\n").join("\n");
      filename = `${phase}-assessment-${slug}.txt`;
      type = "text/plain";
    }

    const blob = new Blob([body], { type: `${type};charset=utf-8` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setToast("Exported " + filename);
  }

  // =====================================================================
  // FIELD RENDERERS
  // =====================================================================

  // =====================================================================
  // STAGE RENDERERS
  // =====================================================================

  function StagePreflight(s) {
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}{s.copy.eyebrow ? ` · ${s.copy.eyebrow}` : ""}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}
        {s.copy.body && <p>{s.copy.body}</p>}
        <div className="card">
          {s.items.map((item) => (
            <div className="pf" key={item.ref}>
              <p className="what">{item.stem}</p>
              <p className="how">{item.hint}</p>
              <div className="row">
                <input
                  type="text"
                  placeholder={item.hint}
                  value={A(item.ref).value || ""}
                  aria-invalid={!!err(item.ref)}
                  onChange={(e) => put(item.ref, { value: e.target.value })}
                />
                <label className="blocked">
                  <input
                    type="checkbox"
                    checked={!!A(item.ref).blocked}
                    onChange={(e) => put(item.ref, { blocked: e.target.checked })}
                  />{" "}
                  blocked
                </label>
              </div>
              {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
            </div>
          ))}
        </div>
      </>
    );
  }

  function StageSelfmap(s) {
    const bands = s.items.filter((i) => i.kind === "band");
    const free = s.items.filter((i) => i.kind !== "band");
    const anchors = s.copy.anchors || [];
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}
        {anchors.length > 0 && (
          <div className="anchors">
            {anchors.map((a) => (
              <div key={a[0]}><b>{a[0]}</b><span>{a[1]}</span></div>
            ))}
          </div>
        )}
        <div className="card flush">
          <table className="mtx">
            <thead>
              <tr>
                <th>I can…</th>
                {[0, 1, 2, 3, 4].map((n) => <th key={n}>{n}</th>)}
                <th>Sure?</th>
              </tr>
            </thead>
            <tbody>
              {bands.map((item) => {
                const a = A(item.ref);
                const conf = (item.config && item.config.confidence) || ["Low", "Med", "High"];
                const rowErr = err(item.ref) || err(`${item.ref}::conf`);
                return (
                  <tr key={item.ref} className={rowErr ? "row-err" : ""} {...(rowErr ? { "data-err": true } : {})}>
                    <td>
                      {item.stem}
                      {rowErr && <div className="field-err">{rowErr}</div>}
                    </td>
                    {[0, 1, 2, 3, 4].map((n) => (
                      <td key={n}>
                        <input
                          type="radio"
                          name={item.ref}
                          value={n}
                          checked={String(a.value) === String(n)}
                          onChange={() => put(item.ref, { value: String(n) })}
                          aria-label={`${item.stem} — band ${n}`}
                        />
                      </td>
                    ))}
                    <td>
                      <select
                        value={a.confidence || ""}
                        onChange={(e) => put(item.ref, { confidence: e.target.value })}
                        aria-label="confidence"
                      >
                        <option value="">–</option>
                        {conf.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {free.map((item) => (
          <div className="field" key={item.ref}>
            <label>{item.stem} <span className="opt">optional</span></label>
            <TextArea
              value={A(item.ref).value}
              rows={(item.config && item.config.rows) || 3}
              placeholder={item.hint}
              onChange={(v) => put(item.ref, { value: v })}
            />
          </div>
        ))}
      </>
    );
  }

  function ScreenDiscriminator(s, item, itemNo) {
    const order = seededOrder(item.options.length, item.id || item.ref);
    const selected = A(item.ref).value || [];
    const type = item.kind === "multi" ? "checkbox" : "radio";

    const pick = (optId, on) => {
      const cur = A(item.ref).value || [];
      const next = item.kind === "multi"
        ? (on ? [...cur, optId] : cur.filter((x) => x !== optId))
        : [optId];
      put(item.ref, { value: next });
    };

    return (
      <>
        <p className="eyebrow">
          {stageLabel(s)} · item {itemNo + 1} of {s.items.length}
          {s.oneWay ? " · no going back" : ""}
        </p>
        <div className="card">
          <div className="qhead">
            <span className="qid">{item.ref}</span>
            <p className="stem">{item.stem}</p>
          </div>
          {item.kind === "multi" && s.copy.multiHint && <p className="hint">{s.copy.multiHint}</p>}
          <div className="opts">
            {order.map((oi) => {
              const opt = item.options[oi];
              return (
                <label className="opt" key={opt.id}>
                  <input
                    type={type}
                    name={item.ref}
                    checked={selected.includes(opt.id)}
                    onChange={(e) => pick(opt.id, e.target.checked)}
                  />
                  <span>{opt.text}</span>
                </label>
              );
            })}
          </div>
          {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
          {item.config && item.config.justify && (
            <div className="field" style={{ marginTop: 16 }}>
              <div className="opt-note">Optional</div>
              <label>{item.config.justify}</label>
              <TextArea
                value={A(item.ref).justification}
                rows={2}
                onChange={(v) => put(item.ref, { justification: v })}
              />
            </div>
          )}
          <Confidence
            name={item.ref}
            choices={item.config && item.config.confidence}
            value={A(item.ref).confidence || ""}
            onChange={(v) => put(item.ref, { confidence: v })}
          />
          {err(`${item.ref}::conf`) && <div className="field-err" data-err>{err(`${item.ref}::conf`)}</div>}
        </div>
      </>
    );
  }

  function ScreenForensics(s, item, n) {
    return (
      <>
        <p className="eyebrow">{stageLabel(s)} · artefact {n + 1} of {s.items.length}</p>
        <h1>{item.stem}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}

        {item.config.code ? (
          <>
            <div className="artefact">
              <div className="cap">{item.config.cap}</div>
              <pre>{item.config.code}</pre>
            </div>
            <p className="sr">Artefact description for screen readers: {item.config.alt}</p>
          </>
        ) : (
          <>
            <div className="note">
              <strong>The situation</strong>
              <p style={{ marginBottom: 0 }}>{item.config.narrative}</p>
            </div>
            <div className="card flush">
              <table className="rev">
                <tbody>
                  {(item.config.evidence || []).map((e) => (
                    <tr key={e[0]}>
                      <td style={{ width: "34%" }}><strong>{e[0]}</strong></td>
                      <td>{e[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
        {(item.config.subs || []).map((sub) => (
          <div className="field" key={sub[0]}>
            <label>({sub[0]}) {sub[1]}</label>
            <TextArea
              value={A(`${item.ref}_${sub[0]}`).value}
              rows={sub[0] === "a" ? 5 : 3}
              invalid={!!err(`${item.ref}_${sub[0]}`)}
              onChange={(v) => put(`${item.ref}_${sub[0]}`, { value: v })}
            />
            {err(`${item.ref}_${sub[0]}`) && <div className="field-err" data-err>{err(`${item.ref}_${sub[0]}`)}</div>}
          </div>
        ))}
      </>
    );
  }

  function StageHandson(s) {
    const ids = s.items.filter((i) => i.kind === "identifier");
    const notes = s.items.filter((i) => i.kind !== "identifier");
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}{s.copy.eyebrow ? ` · ${s.copy.eyebrow}` : ""}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}
        {s.copy.steps && (
          <div className="card">
            <ol style={{ margin: 0, paddingLeft: 22 }}>
              {s.copy.steps.map((step, i) => (
                <li key={i} style={i < s.copy.steps.length - 1 ? { marginBottom: 9 } : undefined}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        {s.copy.body && <p>{s.copy.body}</p>}
        {ids.map((item) => (
          <div className="field" key={item.ref}>
            <label>{item.stem}</label>
            <input
              type="text"
              value={A(item.ref).value || ""}
              placeholder={item.hint}
              aria-invalid={!!err(item.ref)}
              onChange={(e) => put(item.ref, { value: e.target.value })}
            />
            {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
          </div>
        ))}
        {notes.map((item) => (
          <div className="field" key={item.ref}>
            <label>{item.stem}</label>
            <TextArea
              value={A(item.ref).value}
              rows={(item.config && item.config.rows) || 3}
              placeholder={item.hint}
              onChange={(v) => put(item.ref, { value: v })}
            />
          </div>
        ))}
      </>
    );
  }

  function StageWritten(s) {
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}
        {s.items.map((item) => (
          <div className="field" key={item.ref}>
            <label><strong>{item.ref}.</strong> {item.stem}</label>
            <TextArea
              value={A(item.ref).value}
              rows={(item.config && item.config.rows) || 6}
              invalid={!!err(item.ref)}
              onChange={(v) => put(item.ref, { value: v })}
            />
            {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
          </div>
        ))}
      </>
    );
  }

  function StageContext(s) {
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}{s.copy.eyebrow ? ` · ${s.copy.eyebrow}` : ""}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        {s.copy.lead && <p className="lead">{s.copy.lead}</p>}
        {s.items.map((item) => (
          <div className="field" key={item.ref}>
            <label><span className="qid">{item.ref}</span> {item.stem}</label>
            {item.kind === "select" ? (
              <select
                className="pick"
                value={A(item.ref).value || ""}
                aria-invalid={!!err(item.ref)}
                onChange={(e) => put(item.ref, { value: e.target.value })}
              >
                <option value="">Choose one</option>
                {(item.config.choices || []).map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <TextArea
                value={A(item.ref).value}
                rows={(item.config && item.config.rows) || 2}
                invalid={!!err(item.ref)}
                onChange={(v) => put(item.ref, { value: v })}
              />
            )}
            {err(item.ref) && <div className="field-err" data-err>{err(item.ref)}</div>}
          </div>
        ))}
      </>
    );
  }

  function StageReview(s) {
    const gaps = completeness.filter((r) => !r.complete).length;
    return (
      <>
        <p className="eyebrow">{stageLabel(s)}</p>
        <h1>{s.copy.h1 || s.name}</h1>
        <p className="lead">{gaps ? s.copy.leadIncomplete : s.copy.leadComplete}</p>
        <div className="card flush">
          <table className="rev">
            <tbody>
              {completeness.map((r) => (
                <tr key={r.label}>
                  <td><strong>{r.label}</strong></td>
                  <td>{r.detail}</td>
                  <td className={r.complete ? "ok" : "gap"}>{r.complete ? "complete" : "incomplete"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.copy.whatNext && (
          <div className="note">
            <strong>What happens next</strong>
            {s.copy.whatNext.map((p, i) => (
              <p key={i} style={i === s.copy.whatNext.length - 1 ? { marginBottom: 0 } : undefined}>{p}</p>
            ))}
          </div>
        )}
        {gaps > 0 && (
          <div className="err-banner" role="alert">
            <strong>{gaps === 1 ? "1 section is incomplete" : `${gaps} sections are incomplete`}</strong>
            <span>Every question has to be answered before you can submit. Use Back to fill them in.</span>
          </div>
        )}
        <div className="nav">
          {canGoBack() && <button className="btn ghost" onClick={() => go(idx - 1)}>Back</button>}
          <button className="btn" onClick={submit} disabled={submitting || gaps > 0}
                  title={gaps > 0 ? "Answer every question first" : ""}>
            {submitting ? "Submitting…" : "Submit answers"}
          </button>
          <button className="btn ghost" onClick={() => exportAll("csv")}>Export CSV</button>
          <button className="btn ghost" onClick={() => exportAll("txt")}>Export readable copy</button>
        </div>
      </>
    );
  }

  // ---- welcome / ident / done ---------------------------------------

  function ScreenWelcome() {
    const c = assessment.copy || {};
    return (
      <>
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>{assessment.title}</h1>
        <p className="lead">{assessment.lead}</p>
        {c.readThis && (
          <div className="note">
            <strong>Read this first</strong>
            {c.readThis.map((p, i) => (
              <p key={i} style={i === c.readThis.length - 1 ? { marginBottom: 0 } : undefined}>{p}</p>
            ))}
          </div>
        )}
        <h2>What you will be asked to do</h2>
        <table className="rev">
          <tbody>
            {assessment.stages.map((s, i) => (
              <tr key={s.key}>
                <td><strong>{s.name}</strong></td>
                <td>{(c.stageBlurbs || [])[i]}</td>
                <td>{s.meta}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nav">
          <button className="btn" onClick={() => go(1)}>Start</button>
          <span className="navnote">one sitting · timers are advisory · answers save as you go</span>
        </div>
      </>
    );
  }

  function ScreenIdent() {
    const c = assessment.copy || {};
    return (
      <>
        <p className="eyebrow">Who is answering</p>
        <h1>Your name, once</h1>
        <p className="lead">{c.identLead}</p>
        <div className="field">
          <label>Name <span className="req">required</span></label>
          <input
            type="text"
            value={name}
            placeholder="First and last"
            aria-required="true"
            aria-invalid={!nameOk}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && nameOk) go(idx + 1); }}
          />
        </div>
        <div className="field">
          <label>Work email <span className="req">required</span></label>
          <input
            type="text"
            inputMode="email"
            value={email}
            placeholder="your.name@bechtel.com"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!(emailState && emailState !== "ok" && emailState !== "checking")}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => { if (hasContent(email) && emailState === null) checkEmail(); }}
            onKeyDown={(e) => { if (e.key === "Enter") identContinue(); }}
          />
          {emailState === "checking" && <div className="field-note">Checking…</div>}
          {emailState === "ok" && <div className="field-ok">Registered — you can continue.</div>}
          {emailState && emailState !== "ok" && emailState !== "checking" && (
            <div className="field-err" data-err>{emailState}</div>
          )}
        </div>
        {c.identNote && (
          <div className="note">
            <strong>Where this does and does not travel</strong>
            <p style={{ marginBottom: 0 }}>{c.identNote}</p>
          </div>
        )}
        <div className="nav">
          {canGoBack() && <button className="btn ghost" onClick={() => go(idx - 1)}>Back</button>}
          <button className="btn" disabled={!nameOk || emailState === "checking"} onClick={identContinue}>
            {emailState === "checking" ? "Checking…" : "Continue"}
          </button>
          <span className="navnote">
            {!nameOk ? "your name is required to continue"
              : !hasContent(email) ? "your Bechtel email is required to continue"
              : emailOk ? "answers are kept as you go"
              : "we need to check your email before you start"}
          </span>
        </div>
      </>
    );
  }

  function ScreenDone() {
    return (
      <>
        <p className="eyebrow">Recorded</p>
        <h1>Answers recorded</h1>
        <p className="lead">
          Thank you. Your responses are saved{submitted ? ` against ${submitted.participantName}` : ""}. Export a copy for your own records if you want one.
        </p>
        <div className="nav" style={{ borderTop: 0, paddingTop: 0, marginTop: 22 }}>
          <button className="btn" onClick={() => exportAll("csv")}>Export CSV</button>
          <button className="btn ghost" onClick={() => exportAll("txt")}>Export readable copy</button>
        </div>
        <h2>What we do with it</h2>
        <p>
          Five decisions, in this order: pace, pairs, pre-work, the Day 3 variant, and a recommended
          duration. The instrument is a calibration read across the cohort, not a measurement of any one
          person, and the memo says so in those words.
        </p>
        <p style={{ color: "var(--ink-3)", fontSize: 13.5 }}>
          No composite score is computed anywhere in this design. There is nothing to rank, which is a
          stronger guarantee than a promise not to.
        </p>
      </>
    );
  }

  // ---- chrome -------------------------------------------------------

  const stageLabel = (s) => `Stage ${s.idx + 1} of ${assessment.stages.length}`;

  function navBar(oneWay) {
    const isLast = idx >= screens.length - 2; // review is the last interactive screen
    return (
      <>
        {errorCount > 0 && (
          <div className="err-banner" role="alert">
            <strong>{errorCount === 1 ? "1 question still needs an answer" : `${errorCount} questions still need an answer`}</strong>
            <span>Everything on this screen has to be filled in before you can continue.</span>
          </div>
        )}
        <div className="nav">
          {canGoBack() && <button className="btn ghost" onClick={() => go(idx - 1)}>Back</button>}
          {!isLast && <button className="btn" onClick={() => tryAdvance(idx + 1)}>Continue</button>}
          <span className="navnote">
            {oneWay ? "one item per screen · no going back inside this stage" : "answers are kept as you go"}
          </span>
        </div>
      </>
    );
  }

  function Rail() {
    const cur = screen ? screen.stageIdx : null;
    return (
      <nav className="rail" aria-label="Assessment stages">
        <div className="railinner">
        <h2>Stages</h2>
        <div>
          {assessment.stages.map((s, i) => {
            const state = cur === null ? "" : i < cur ? "done" : i === cur ? "run" : "";
            const secs = Math.round((stageTimes.current[i] || 0) / 1000);
            const el = secs > 3 ? ` · ${Math.floor(secs / 60)}m${String(secs % 60).padStart(2, "0")}s` : "";
            return (
              <div className="stage" data-state={state} key={s.key}>
                <div className="dot" />
                <div>
                  <div className="nm">{s.name}</div>
                  <div className="mt">{s.meta}{el}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="railnote">
          Answers are saved as you go and can be resumed on this device.
        </div>

        <div className="rail-admin">
          {admin ? (
            <button className="rail-admin-btn signed-in" onClick={onOpenAdmin}>
              Open admin dashboard
              <span className="rail-admin-who">{admin.displayName || admin.username}</span>
            </button>
          ) : (
            <button className="rail-admin-btn" onClick={() => setAdminOpen(true)}>
              Log in as admin
            </button>
          )}
        </div>
        </div>
      </nav>
    );
  }

  // ---- render -------------------------------------------------------

  if (loadError) {
    return (
      <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
        <main>
          <p className="eyebrow">Not available</p>
          <h1>The {phase} assessment is not open yet</h1>
          <p className="lead">{loadError}</p>
          {phase === "post" && (
            <div className="nav">
              <button className="btn" onClick={() => setPhase("pre")}>Go to the pre-assessment</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
        <main><p className="lead">Loading…</p></main>
      </div>
    );
  }

  let body = null;
  if (screen.key === "welcome") body = ScreenWelcome();
  else if (screen.key === "ident") body = ScreenIdent();
  else if (screen.key === "done") body = ScreenDone();
  else if (screen.item) {
    body = stage.kind === "forensics"
      ? ScreenForensics(stage, screen.item, screen.itemNo)
      : ScreenDiscriminator(stage, screen.item, screen.itemNo);
  }
  else if (stage.kind === "preflight") body = StagePreflight(stage);
  else if (stage.kind === "selfmap") body = StageSelfmap(stage);
  else if (stage.kind === "handson") body = StageHandson(stage);
  else if (stage.kind === "written") body = StageWritten(stage);
  else if (stage.kind === "context") body = StageContext(stage);
  else if (stage.kind === "review") body = StageReview(stage);

  const showNav = !["welcome", "ident", "done"].includes(screen.key) && !(stage && stage.kind === "review");
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <>
      <div className="banner">
        <span className="brand">
          <img src="/logo-white.svg" alt="Edstellar" />
        </span>
        <span className="sep">/</span>
        <span>{assessment.subtitle}</span>
        <span className="clock">
          <span>elapsed {mm}:{ss}</span>
        </span>
      </div>

      <div className="shell">
        <Rail />
        <main ref={mainRef} tabIndex={-1}>
          {body}
          {showNav && navBar(stage && stage.oneWay)}
        </main>
      </div>

      <div className={"toast" + (toast ? " up" : "")}>{toast}</div>

      {adminOpen && (
        <AdminLogin onClose={closeAdmin} onSignedIn={signedInAdmin} />
      )}
    </>
  );
}
