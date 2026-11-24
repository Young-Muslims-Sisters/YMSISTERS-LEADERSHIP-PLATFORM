"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { localLoginEnabled, safeNext } from "@/lib/server/access";
import { supabaseSession } from "@/lib/server/supabase-session";

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;
  const db = await supabaseSession();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${next}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?error=failed");
  redirect(data.url);
}

// Development only: sign in as one of the fictional accounts in seeds/local_auth.sql.
export async function signInLocally(formData: FormData) {
  if (!localLoginEnabled()) redirect("/login?error=failed");
  const account = formData.get("account") === "it-admin" ? "it-admin" : "member";
  const db = await supabaseSession();
  const { error } = await db.auth.signInWithPassword({ email: `${account}@example.test`, password: "local-dev-only" });
  redirect(error ? "/login?error=failed" : safeNext(formData.get("next")));
}

export async function signOut() {
  const db = await supabaseSession();
  await db.auth.signOut({ scope: "local" });
  redirect("/");
}
