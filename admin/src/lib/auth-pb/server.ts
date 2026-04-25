/**
 * Server-side PB auth — replacement for `@supabase/ssr` server client.
 *
 * Same shape as `lib/supabase/server.ts`'s `createClient()` API, but
 * authenticates against `mbg-pb-admin`'s built-in `users` collection
 * instead of Supabase Auth.
 *
 * Session is a PB JWT stored in an HTTP-only cookie (`mbg_pb_session`).
 * On each request, the cookie is verified server-side via PB's
 * `/api/collections/users/auth-refresh` (re-issues a fresh token,
 * returning the user record). Failed verification returns null.
 */

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME as COOKIE_NAME,
  type PbUser,
  type SessionData,
} from "./middleware";

/** PB auth tokens default to 14 days; use the same. */
const COOKIE_MAX_AGE = 14 * 24 * 60 * 60;

export { COOKIE_NAME as SESSION_COOKIE_NAME };
export type { PbUser, SessionData };

function pbAdminUrl(): string {
  const url = process.env.POCKETBASE_ADMIN_URL;
  if (!url) {
    throw new Error("POCKETBASE_ADMIN_URL is required for admin auth");
  }
  return url;
}

/** Read the session cookie and refresh it against PB. Returns null if no/invalid session. */
export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const res = await fetch(`${pbAdminUrl()}/api/collections/users/auth-refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const body = (await res.json()) as { token: string; record: PbUser };
  return { user: body.record, token: body.token };
}

/**
 * Sign in via email + password (called from server actions / API routes).
 * Sets the session cookie on success. Returns the user on success or
 * null + an error message on failure.
 */
export async function serverSignIn(
  email: string,
  password: string,
): Promise<{ user: PbUser; error: null } | { user: null; error: string }> {
  const res = await fetch(
    `${pbAdminUrl()}/api/collections/users/auth-with-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    let msg = "Invalid email or password";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) msg = body.message;
    } catch {
      // ignore parse errors — fallback message used
    }
    return { user: null, error: msg };
  }
  const body = (await res.json()) as { token: string; record: PbUser };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, body.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return { user: body.record, error: null };
}

/** Clear the session cookie. */
export async function serverSignOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
