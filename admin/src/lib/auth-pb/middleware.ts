/**
 * Middleware/Edge-runtime variant of PB auth — uses NextRequest's cookie
 * jar instead of `next/headers` (which only works in server components).
 *
 * Imported only by `admin/src/proxy.ts`.
 */

export const SESSION_COOKIE_NAME = "mbg_pb_session";

export interface PbUser {
  id: string;
  email: string;
  name?: string;
  is_mbg_admin: boolean;
  created: string;
  updated: string;
}

export interface SessionData {
  user: PbUser;
  token: string;
}

function pbAdminUrl(): string {
  const url = process.env.POCKETBASE_ADMIN_URL;
  if (!url) {
    throw new Error("POCKETBASE_ADMIN_URL is required for admin auth");
  }
  return url;
}

export async function getMiddlewareSession(opts: {
  cookieValue: string | undefined;
  setCookie?: (
    name: string,
    value: string,
    options: Record<string, unknown>,
  ) => void;
}): Promise<SessionData | null> {
  if (!opts.cookieValue) return null;
  const res = await fetch(
    `${pbAdminUrl()}/api/collections/users/auth-refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: opts.cookieValue,
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { token: string; record: PbUser };
  if (opts.setCookie) {
    opts.setCookie(SESSION_COOKIE_NAME, body.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return { user: body.record, token: body.token };
}
