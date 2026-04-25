import { NextResponse } from "next/server";

/**
 * OAuth callback. Now that auth runs on Pocketbase (email+password only,
 * no OAuth providers configured), this endpoint is decommissioned. Any
 * lingering links from old Supabase OAuth flows redirect to /login with
 * a friendly error.
 *
 * Re-enable this route if/when we wire OAuth providers (Google, Apple)
 * into PB's `users` collection — see PB docs on OAuth2 providers.
 */
export async function GET() {
  return NextResponse.redirect(
    new URL(
      "/login?error=oauth_not_supported",
      process.env.NEXT_PUBLIC_APP_URL ?? "https://mbg-admin.fly.dev",
    ),
  );
}
