// ---------------------------------------------------------------
// API client — thin wrapper over the Express REST endpoints.
// Keeps the component clean and centralises all fetch() calls.
// ---------------------------------------------------------------

const SESSION_STORAGE_KEY = "junglelms_sid";

function getSessionId() {
  let sid = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

async function safeFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // ---- Session -------------------------------------------------

  async getSession() {
    try {
      const sid = getSessionId();
      const { data } = await safeFetch(`/api/session/${sid}`);
      return data; // object or null
    } catch {
      return null;
    }
  },

  async setSession(data) {
    try {
      const sid = getSessionId();
      await safeFetch(`/api/session/${sid}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch {
      // non-fatal — the user just won't be able to resume
    }
  },

  async deleteSession() {
    try {
      const sid = getSessionId();
      await safeFetch(`/api/session/${sid}`, { method: "DELETE" });
    } catch {
      // non-fatal
    }
  },

  // ---- Results -------------------------------------------------

  async getResults() {
    try {
      const { results } = await safeFetch("/api/results");
      return results; // already sorted newest-first by the server
    } catch {
      return [];
    }
  },

  async saveResult(result) {
    try {
      await safeFetch("/api/results", {
        method: "POST",
        body: JSON.stringify(result),
      });
    } catch {
      // non-fatal — local result still shows on screen
    }
  },
};
