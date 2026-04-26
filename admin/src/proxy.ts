import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

/** API paths that use their own auth (shared secrets, not Supabase session). */
function isSelfAuth(pathname: string): boolean {
  if (!pathname.startsWith("/api/tenants/")) return false;
  // Build-link callback uses ADMIN_BUILD_LINK_SECRET header.
  if (pathname.includes("/build-link")) return true;
  // Mobile-app push token registration is public (no user session) — the
  // route handler itself validates the payload. See:
  //   admin/src/app/api/tenants/[id]/notifications/register/route.ts
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

  // Forward the path as a request header so server components can read it
  // (Next.js doesn't expose request URL via next/headers). Used by the
  // client portal layout to skip its auth gate on the login page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isPublic(pathname) || isStaticAsset(pathname) || isSelfAuth(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Send unauthenticated traffic to the appropriate login page.
    const loginPath = isClientPath(pathname) ? "/client/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Resolve role to gate cross-portal access. Cheapest signal first.
  const isAdminFromMeta = (user.app_metadata as Record<string, unknown> | undefined)?.role === "admin";
  let isAdmin = isAdminFromMeta;
  if (!isAdmin) {
    const { data: rows } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);
    isAdmin = (rows?.length ?? 0) > 0;
  }

  // Clients should only see /client/*. Bounce them away from admin-only paths.
  if (!isAdmin && !isClientPath(pathname)) {
    return NextResponse.redirect(new URL("/client", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
