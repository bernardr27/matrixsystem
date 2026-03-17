/** Generate a random 6-digit code */
export function generateLoginCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store pending codes for Discord verification
const pendingCodes = new Map<string, { username: string, expiresAt: number, verified: boolean }>();

/** Create and store a login code for a username */
export function createLoginCode(username: string): string {
    const code = generateLoginCode();
    pendingCodes.set(code, { username, expiresAt: Date.now() + 5 * 60 * 1000, verified: false });
    return code;
}

/** Verify code from Discord bot (marks as verified but keeps it) */
export function verifyLoginCode(code: string, discordId: string): string | null {
    const entry = pendingCodes.get(code);
    if (!entry || Date.now() > entry.expiresAt) return null;
    entry.verified = true;
    return entry.username;
}

/** Check if code is verified, consume it and return username if true */
export function consumeVerifiedCode(code: string): string | null {
    const entry = pendingCodes.get(code);
    if (!entry || Date.now() > entry.expiresAt || !entry.verified) return null;
    pendingCodes.delete(code);
    return entry.username;
}
import crypto from 'crypto';

/* ═══════════════════════════════════════════════════════
   CITADEL AUTH v1.0 — Session-based authentication
   Default: operator / citadel  (override via env vars)
   ═══════════════════════════════════════════════════════ */

const DEFAULT_USER = process.env.CITADEL_USER || 'operator';
const DEFAULT_PASS = process.env.CITADEL_PASS || 'citadel';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
    username: string;
    createdAt: number;
    expiresAt: number;
}

// @ts-ignore
declare global {
    var _citadelSessions: Map<string, SessionData> | undefined;
}

// In-memory session store (resets on server restart, but persists HMR)
const sessions = global._citadelSessions || new Map<string, SessionData>();
if (process.env.NODE_ENV !== 'production') global._citadelSessions = sessions;

/** Timing-safe credential verification */
export function verifyCredentials(username: string, password: string): boolean {
    const userBuf = Buffer.alloc(256);
    const expectedUserBuf = Buffer.alloc(256);
    const passBuf = Buffer.alloc(256);
    const expectedPassBuf = Buffer.alloc(256);

    userBuf.write(username);
    expectedUserBuf.write(DEFAULT_USER);
    passBuf.write(password);
    expectedPassBuf.write(DEFAULT_PASS);

    const userMatch = crypto.timingSafeEqual(userBuf, expectedUserBuf);
    const passMatch = crypto.timingSafeEqual(passBuf, expectedPassBuf);

    return userMatch && passMatch;
}

/** Create a new session and return the token */
export function createSession(username: string): string {
    // Purge expired sessions
    const now = Date.now();
    for (const [token, data] of sessions) {
        if (now > data.expiresAt) sessions.delete(token);
    }

    const token = crypto.randomUUID();
    sessions.set(token, {
        username,
        createdAt: now,
        expiresAt: now + SESSION_DURATION,
    });
    return token;
}

/** Validate a session token, returns session data or null */
export function validateSession(token: string): SessionData | null {
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    return session;
}

/** Destroy a session */
export function destroySession(token: string): void {
    sessions.delete(token);
}

/** Get active session count */
export function getSessionCount(): number {
    const now = Date.now();
    let count = 0;
    for (const [, data] of sessions) {
        if (now <= data.expiresAt) count++;
    }
    return count;
}
