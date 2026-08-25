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

async function request(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { error: body.error || `${res.status} ${res.statusText}`, ...body };
  return body;
}

export const api = {
  // ---- Assessment content --------------------------------------

  /** Returns { assessment } or { error }. */
  getAssessment(phase) {
    return request(`/api/assessment/${phase}`);
  },

  listAssessments() {
    return request("/api/assessments");
  },

  // ---- Session (resume) ----------------------------------------

  async getSession() {
    const res = await request(`/api/session/${getSessionId()}`);
    return res.error ? null : res.data;
  },

  async setSession(data) {
    // Non-fatal: the participant just won't be able to resume.
    await request(`/api/session/${getSessionId()}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteSession() {
    await request(`/api/session/${getSessionId()}`, { method: "DELETE" });
  },

  // ---- Attempts ------------------------------------------------

  submitAttempt(payload) {
    return request("/api/attempts", { method: "POST", body: JSON.stringify(payload) });
  },

  getAttempts(phase) {
    return request(`/api/attempts${phase ? `?phase=${phase}` : ""}`);
  },

  getProgress() {
    return request("/api/progress");
  },

  participantStatus(name) {
    return request(`/api/participant/${encodeURIComponent(name)}/status`);
  },
};
