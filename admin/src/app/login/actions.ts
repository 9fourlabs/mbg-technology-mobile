"use server";

import { redirect } from "next/navigation";
import { serverSignIn } from "@/lib/auth-pb/server";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { user, error } = await serverSignIn(email, password);
  if (!user) {
    return { error: error ?? "Sign in failed." };
  }

  // Same-origin redirect guard (relative paths only).
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

  // For client portal users, default landing is /client.
  const dest =
    !user.is_mbg_admin && safeRedirect === "/" ? "/client" : safeRedirect;

  redirect(dest);
}
