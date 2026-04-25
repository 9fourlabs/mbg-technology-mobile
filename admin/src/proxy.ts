import { NextResponse, type NextRequest } from "next/server";
import { getMiddlewareSession, SESSION_COOKIE_NAME } from "@/lib/auth-pb/middleware";

/** Paths that never require authentication. */
const PUBLIC_PATHS = [
  "/login",
  "/client/login",
  "/api/auth/callback",
  "/share",
];

/** Paths reserved for the client portal (clients land here; admins may also enter). */
function isClientPath(pathname: string): boolean {
  return pathname === "/client" || pathname.startsWith("/client/");
}

/** API paths that use their own auth (shared secrets, not user session). */
function isSelfAuth(pathname: string): boolean {
  if (!pathname.startsWith("/api/tenants/")) return false;
  // Build-link callback uses ADMIN_BUILD_LINK_SECRET header.
  if (pathname.includes("/build-link")) return true;
  // Mobile-app push token registration is public (no user session).
  if (pathname.endsWith("/notifications/register")) return true;
  return false;
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward the path as a request header so server components can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isPublic(pathname) || isStaticAsset(pathname) || isSelfAuth(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Validate session cookie against PB. If the session is valid, PB returns
  // a refreshed token — we re-set the cookie on the response.
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await getMiddlewareSession({
    cookieValue,
    setCookie: (name, value, options) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    },
  });

  if (!session) {
    // Send unauthenticated traffic to the appropriate login page.
    const loginPath = isClientPath(pathname) ? "/client/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Resolve role to gate cross-portal access. Admins pass everywhere; clients
  // are bounced from MBG admin pages to their portal. API routes are open
  // to any authenticated user (each route does its own authz).
  if (
    !session.user.is_mbg_admin &&
    !isClientPath(pathname) &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/client", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
