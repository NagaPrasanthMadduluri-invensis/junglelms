import React, { useEffect, useState } from "react";
import Assessment from "./Assessment";
import Admin from "./Admin";
import { adminApi } from "./adminApi";

// =====================================================================
// One app, two faces. Participants see the assessment; an admin who signs
// in from the sidebar button gets the dashboard in the same tab.
// =====================================================================

export default function App() {
  const [admin, setAdmin] = useState(null);   // { username, displayName }
  const [viewing, setViewing] = useState(false);

  // Pick up an existing session, so a signed-in admin is not asked again.
  useEffect(() => {
    adminApi.me().then((res) => { if (res.ok) setAdmin({ username: res.username, displayName: res.displayName }); });
  }, []);

  if (admin && viewing) {
    return (
      <Admin
        admin={admin}
        onExit={() => setViewing(false)}
        onSignedOut={() => { setAdmin(null); setViewing(false); }}
      />
    );
  }

  return (
    <Assessment
      admin={admin}
      onAdminSignedIn={(who) => { setAdmin(who); setViewing(true); }}
      onOpenAdmin={() => setViewing(true)}
    />
  );
}
