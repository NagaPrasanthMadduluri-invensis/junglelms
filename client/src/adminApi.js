// ---------------------------------------------------------------
// Admin API client.
//
// Every call sends credentials, because the admin session lives in an
// httpOnly cookie that page JavaScript deliberately cannot read.
// ---------------------------------------------------------------

async function request(url, opts = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { error: body.error || `${res.status} ${res.statusText}`, code: body.code, status: res.status };
  return body;
}

export const adminApi = {
  /** Public — is there an admin account at all? */
  status() {
    return request("/api/admin/status");
  },

  me() {
    return request("/api/admin/me");
  },

  login(username, password) {
    return request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request("/api/admin/logout", { method: "POST" });
  },

  overview(phase) {
    return request(`/api/admin/overview?phase=${encodeURIComponent(phase)}`);
  },

  participant(id) {
    return request(`/api/admin/participants/${encodeURIComponent(id)}`);
  },

  /** Exports stream as CSV, so they go through a normal navigation. */
  exportUrl(kind, phase) {
    return `/api/admin/export/${kind}.csv?phase=${encodeURIComponent(phase)}`;
  },
};
