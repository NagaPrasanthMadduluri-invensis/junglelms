import React, { useCallback, useEffect, useState } from "react";
import Assessment from "./Assessment";
import Admin from "./Admin";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import { api } from "./api";
import { adminApi } from "./adminApi";

// =====================================================================
// One app, three states: signed out, taking the assessment, or in the
// dashboard. Nothing about the assessment loads until a participant has
// authenticated, and only one session per account is ever live.
// =====================================================================

export default function App() {
  const [ready, setReady] = useState(false);
  const [participant, setParticipant] = useState(null); // { email }
  const [admin, setAdmin] = useState(null);             // { username, displayName }
  const [viewingAdmin, setViewingAdmin] = useState(false);
  const [adminModal, setAdminModal] = useState(false);
  const [notice, setNotice] = useState("");

  // Restore whichever session exists.
  useEffect(() => {
    (async () => {
      const [p, a] = await Promise.all([api.me(), adminApi.me()]);
      if (p.ok) setParticipant({ email: p.email });
      if (a.ok) setAdmin({ username: a.username, displayName: a.displayName });
      setReady(true);
    })();
  }, []);

  /**
   * Called when the server says this session is no longer the live one.
   * Drops straight back to sign-in with the reason, rather than leaving a
   * half-working screen behind.
   */
  const sessionEnded = useCallback((message) => {
    setParticipant(null);
    setViewingAdmin(false);
    setAdmin(null);
    setNotice(message || "Your session ended because this account was signed in elsewhere.");
  }, []);

  const signOutParticipant = useCallback(async () => {
    await api.logout();
    setParticipant(null);
    setNotice("You have been signed out.");
  }, []);

  if (!ready) return <div className="login-page"><p>Loading…</p></div>;

  // ---- dashboard ----
  if (admin && viewingAdmin) {
    return (
      <Admin
        admin={admin}
        onExit={() => setViewingAdmin(false)}
        onSignedOut={() => { setAdmin(null); setViewingAdmin(false); }}
        onSessionEnded={sessionEnded}
      />
    );
  }

  // ---- the assessment ----
  if (participant) {
    return (
      <Assessment
        participant={participant}
        admin={admin}
        onOpenAdmin={() => setViewingAdmin(true)}
        onAdminSignedIn={(who) => { setAdmin(who); setViewingAdmin(true); }}
        onSignOut={signOutParticipant}
        onSessionEnded={sessionEnded}
      />
    );
  }

  // ---- signed out ----
  return (
    <>
      <Login
        notice={notice}
        onSignedIn={(who) => { setNotice(""); setParticipant(who); }}
        onAdminClick={() => (admin ? setViewingAdmin(true) : setAdminModal(true))}
      />
      {adminModal && (
        <AdminLogin
          onClose={() => setAdminModal(false)}
          onSignedIn={(who) => { setAdminModal(false); setAdmin(who); setViewingAdmin(true); }}
        />
      )}
    </>
  );
}
