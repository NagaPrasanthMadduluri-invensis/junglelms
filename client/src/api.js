// ---------------------------------------------------------------
// API client — thin wrapper over the Express REST endpoints.
// Keeps the component clean and centralises all fetch() calls.
// ---------------------------------------------------------------

const SESSION_STORAGE_KEY = "bechtel_assessment_sid";

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
    credentials: "include",   // the session lives in an httpOnly cookie
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.error || `${res.status} ${res.statusText}`, status: res.status, ...body };
  }
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

  // ---- Authentication ------------------------------------------

  login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request("/api/auth/logout", { method: "POST" });
  },

  /** Who is signed in, if anyone. */
  me() {
    return request("/api/auth/me");
  },

  // ---- Session (resume) ----------------------------------------

  /**
   * Returns { ok, data }. `ok:false` means the read itself failed — the caller
   * must NOT treat that as "no saved session", or it will overwrite good
   * answers with an empty state on the next save.
   */
  async getSession() {
    const res = await request(`/api/session/${getSessionId()}`);
    if (res.error) return { ok: false, data: null, code: res.code, error: res.error };
    return { ok: true, data: res.data };
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
