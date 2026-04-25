import { NextResponse } from "next/server";
import { serverSignOut } from "@/lib/auth-pb/server";

/**
 * Sign the current user out and redirect to the appropriate login page.
 */
export async function POST(request: Request) {
  await serverSignOut();

  const { searchParams, origin } = new URL(request.url);
  const referer = request.headers.get("referer") ?? "";
  const isClientPortal =
    searchParams.get("portal") === "client" || referer.includes("/client");

  return NextResponse.redirect(
    `${origin}${isClientPortal ? "/client/login" : "/login"}`,
    { status: 303 },
  );
}
