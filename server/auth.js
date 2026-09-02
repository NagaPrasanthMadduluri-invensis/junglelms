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

const COOKIE_NAME = "jl_admin";          // admin dashboard
const PARTICIPANT_COOKIE = "bx_session"; // assessment participant
const SESSION_HOURS = 12;
const PARTICIPANT_SESSION_HOURS = 8;

const crypto2 = require("crypto");

/** Opaque, unguessable session id, stored server-side in auth_sessions. */
function newSessionId() {
  return crypto2.randomBytes(24).toString("base64url");
}

// =====================================================================
// PASSWORD GENERATION
//
// Ambiguous characters are excluded on purpose: these passwords are read off
// a spreadsheet and typed by hand, so 0/O, 1/l/I and similar cause support
// calls. Every class is guaranteed present, and the result is shuffled with
// a CSPRNG rather than Math.random.
// =====================================================================

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // no I, O
const LOWER = "abcdefghijkmnopqrstuvwxyz";   // no l
const DIGIT = "23456789";                    // no 0, 1
const SYMBOL = "!#$%&*+-=?@";                // shell- and CSV-safe enough

/** Uniform random integer in [0, max) with no modulo bias. */
function randomInt(max) {
  const limit = Math.floor(0xffffffff / max) * max;
  let x;
  do { x = crypto2.randomBytes(4).readUInt32BE(0); } while (x >= limit);
  return x % max;
}

const pick = (set) => set[randomInt(set.length)];

function generatePassword(length = 14) {
  const pool = UPPER + LOWER + DIGIT + SYMBOL;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < length) chars.push(pick(pool));
  // Fisher-Yates with a CSPRNG, so the guaranteed classes are not positional.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

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

function cookieString(name, value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${name}=${value}; HttpOnly;${secure} Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

// Several cookies may need setting on one response, so append rather than
// overwrite — res.setHeader would discard a previously set cookie.
function appendCookie(res, value) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) res.setHeader("Set-Cookie", value);
  else res.setHeader("Set-Cookie", [].concat(existing, value));
}

function setSessionCookie(res, token) {
  appendCookie(res, cookieString(COOKIE_NAME, token, SESSION_HOURS * 3600));
}

function clearSessionCookie(res) {
  appendCookie(res, cookieString(COOKIE_NAME, "", 0));
}

function setParticipantCookie(res, token) {
  appendCookie(res, cookieString(PARTICIPANT_COOKIE, token, PARTICIPANT_SESSION_HOURS * 3600));
}

function clearParticipantCookie(res) {
  appendCookie(res, cookieString(PARTICIPANT_COOKIE, "", 0));
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
    const signed = verifyToken(token, await sessionSecret());
    if (!signed) return res.status(401).json({ error: "not signed in", code: "unauthenticated" });

    // A valid signature is not enough: the session must still be the live one
    // for this account. If it is gone, someone signed in elsewhere.
    const live = signed.sid ? await db.getAuthSession(signed.sid) : null;
    if (!live || live.subject !== signed.sub) {
      return res.status(401).json({
        error: "This account was signed in on another device or browser, so this session ended.",
        code: "session_replaced",
      });
    }
    await db.touchAuthSession(live.id);
    req.admin = signed;
    req.authSession = live;
    next();
  } catch (e) { next(e); }
}

/**
 * Require a signed-in participant. Same single-session rule as the admin:
 * the signature must verify AND the session must still be the live one.
 */
async function participantOnly(req, res, next) {
  try {
    const token = parseCookies(req)[PARTICIPANT_COOKIE];
    const signed = verifyToken(token, await sessionSecret());
    if (!signed) return res.status(401).json({ error: "Please sign in to continue.", code: "unauthenticated" });

    const live = signed.sid ? await db.getAuthSession(signed.sid) : null;
    if (!live || live.subject !== signed.sub) {
      return res.status(401).json({
        error: "Your account was signed in on another device or browser, so this session ended.",
        code: "session_replaced",
      });
    }

    // Roster membership is re-checked on every request, so revoking someone
    // takes effect immediately rather than at their next login.
    const entry = await db.getRosterEntry(signed.sub);
    if (!entry || entry.role !== "participant") {
      await db.endAuthSession(live.id);
      return res.status(403).json({ error: "This account can no longer take the assessment.", code: "not_registered" });
    }

    await db.touchAuthSession(live.id);
    req.participant = { email: entry.email, role: entry.role, sessionId: live.id };
    next();
  } catch (e) { next(e); }
}

module.exports = {
  COOKIE_NAME, PARTICIPANT_COOKIE, SESSION_HOURS, PARTICIPANT_SESSION_HOURS,
  newSessionId, generatePassword,
  setParticipantCookie, clearParticipantCookie, participantOnly,
  hashPassword, verifyPassword,
  signToken, verifyToken,
  parseCookies, setSessionCookie, clearSessionCookie,
  sessionSecret, isConfigured, adminOnly,
};
