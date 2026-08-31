import React, { useEffect, useRef, useState } from "react";
import { adminApi } from "./adminApi";

// =====================================================================
// Admin sign-in modal, opened from the button at the foot of the sidebar.
// =====================================================================

export default function AdminLogin({ onClose, onSignedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(null);
  const firstField = useRef(null);

  useEffect(() => {
    adminApi.status().then((res) => setConfigured(res.configured !== false));
  }, []);

  // Focus the first field ONCE, when the modal opens.
  //
  // This must not depend on any prop. The parent re-renders every second (it
  // runs the elapsed-time clock), which hands us a fresh `onClose` each tick —
  // and a focus() call in an effect keyed on that would steal the caret back
  // to the username field every second while someone typed their password.
  useEffect(() => {
    if (firstField.current) firstField.current.focus();
  }, []);

  // Escape closes. Bound once; the latest onClose is read through a ref so
  // re-renders never re-bind the listener.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await adminApi.login(username, password);
    setBusy(false);
    if (res.error) { setError(res.error); setPassword(""); return; }
    onSignedIn({ username: res.username, displayName: res.displayName });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Admin sign in">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <p className="eyebrow">Bechtel × Edstellar · Applied MLOps</p>
        <h2 className="modal-title">Admin sign in</h2>

        {configured === false ? (
          <>
            <p className="modal-lead">
              No admin account has been set up yet.
            </p>
            <p className="modal-foot">
              Your Edstellar contact can create one — no redeploy is needed.
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="modal-lead">
              This dashboard shows every participant's answers.
            </p>

            <div className="field">
              <label>Email</label>
              {/* type="text", not type="email", on purpose: this is a real
                  form, so the browser would refuse to submit the standalone
                  "admin" account, which is not an address. inputMode still
                  raises an email keyboard on mobile. */}
              <input
                ref={firstField}
                type="text"
                inputMode="email"
                value={username}
                placeholder="your.name@bechtel.com"
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} autoComplete="current-password"
                     onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <div className="admin-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
              <button className="btn" type="submit" disabled={busy || !username || !password}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
