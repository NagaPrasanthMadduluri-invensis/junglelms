const crypto = require("crypto");
const db = require("./db");

// =====================================================================
// ADMIN AUTH
//
// Admin accounts live in the database (the `admins` table), so they can be
// added or have their password reset with `npm run admin:create` and no
// redeploy. Nothing about admin access lives in the environment.
//
// The cookie signing secret is generated once and kept in `settings`, so a
// fresh install needs no configuration at all.
//
// The session is a signed token in an httpOnly cookie: the browser holds it,
// page JavaScript cannot read it, and no session state is stored server-side
// (which is what keeps this working on serverless).
// =====================================================================

const COOKIE_NAME = "jl_admin";
const SESSION_HOURS = 12;

// ---- password hashing ------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password, salt = crypto.randomBytes(16)) {
  const key = crypto.scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p,
  });
  // Colon-delimited, not "$"-delimited: a "$" in an env value gets expanded
  // by shells, docker-compose and some CI systems, silently corrupting the
  // hash. Colons pass through every one of them untouched.
  return `scrypt:${SCRYPT.N}:${SCRYPT.r}:${SCRYPT.p}:${salt.toString("hex")}:${key.toString("hex")}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, N, r, p, saltHex, keyHex] = String(stored).split(":");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: Number(N), r: Number(r), p: Number(p),
    });
    // Constant-time — a length mismatch alone must not leak through timing.
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ---- session tokens --------------------------------------------

const b64 = (buf) => Buffer.from(buf).toString("base64url");

function signToken(payload, secret) {
  const body = b64(JSON.stringify(payload));
  const sig = b64(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = b64(crypto.createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- cookies ---------------------------------------------------

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly;${secure} Path=/; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly;${secure} Path=/; SameSite=Lax; Max-Age=0`);
}

// ---- signing secret --------------------------------------------

const SECRET_KEY = "admin_session_secret";

/**
 * The HMAC key for session cookies, created on first use and stored in the
 * settings table. Rotating it (deleting the row) signs everyone out.
 */
async function sessionSecret() {
  let secret = await db.getSetting(SECRET_KEY);
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await db.setSetting(SECRET_KEY, secret);
  }
  return secret;
}

/** True once at least one active admin exists. */
async function isConfigured() {
  return (await db.countAdmins()) > 0;
}

// ---- middleware ------------------------------------------------

/** Rejects anything without a valid, unexpired admin session cookie. */
async function adminOnly(req, res, next) {
  try {
    if (!(await isConfigured())) {
      return res.status(503).json({
        error: "no admin account exists yet — run `npm run admin:create`",
        code: "not_configured",
      });
    }
    const token = parseCookies(req)[COOKIE_NAME];
    const session = verifyToken(token, await sessionSecret());
    if (!session) return res.status(401).json({ error: "not signed in", code: "unauthenticated" });
    req.admin = session;
    next();
  } catch (e) { next(e); }
}

module.exports = {
  COOKIE_NAME, SESSION_HOURS,
  hashPassword, verifyPassword,
  signToken, verifyToken,
  parseCookies, setSessionCookie, clearSessionCookie,
  sessionSecret, isConfigured, adminOnly,
};
