import React, { useEffect, useRef, useState } from "react";
import { api } from "./api";
import "./assessment.css";
import "./admin.css";

// =====================================================================
// Participant sign-in. Stands in front of the assessment: nothing loads
// until the roster has authenticated this email and password.
// =====================================================================

export default function Login({ onSignedIn, onAdminClick, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef(null);

  // Focus once, on mount only — a dependency here would steal the caret back
  // from the password field on every parent re-render.
  useEffect(() => { if (first.current) first.current.focus(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await api.login(email.trim(), password);
    setBusy(false);
    if (res.error) { setError(res.error); setPassword(""); return; }
    onSignedIn({ email: res.email });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo-white.svg" alt="Edstellar" className="login-logo" />
        <p className="eyebrow">Bechtel × Edstellar</p>
        <h1>Applied MLOps on Databricks and Azure DevOps</h1>
        <p className="login-lead">
          Sign in with the Bechtel address your invitation was sent to, and the
          password you were given.
        </p>

        {notice && <div className="login-notice">{notice}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input
              ref={first}
              type="text"
              inputMode="email"
              value={email}
              placeholder="your.name@bechtel.com"
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="admin-error">{error}</div>}

          <button className="btn login-btn" type="submit" disabled={busy || !email || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-foot">
          <p>
            One sitting, one device: signing in somewhere else ends this session.
          </p>
          <button className="login-admin-link" onClick={onAdminClick}>
            Administrator sign-in
          </button>
        </div>
      </div>
    </div>
  );
}
