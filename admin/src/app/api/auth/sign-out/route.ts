import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign the current user out and redirect to the appropriate login page.
 * Called from the sign-out button in both the admin sidebar and the client
 * portal header.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { searchParams, origin } = new URL(request.url);
  const referer = request.headers.get("referer") ?? "";
  const isClientPortal =
    searchParams.get("portal") === "client" || referer.includes("/client");

  return NextResponse.redirect(
    `${origin}${isClientPortal ? "/client/login" : "/login"}`,
    { status: 303 } // 303 forces GET on the redirected URL after a POST
  );
}
