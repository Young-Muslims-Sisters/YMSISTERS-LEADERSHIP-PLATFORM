import "server-only";
import { supabaseAdmin } from "./supabase-admin";

const MAX_MISMATCHES_PER_HOUR = 5;

export type IdentityResult = "ok" | "mismatch" | "too_many_attempts";

// Stops someone from overwriting another person: a known email must match the date of birth on file.
export async function checkIdentity(email: string, birthday: string): Promise<IdentityResult> {
  const db = supabaseAdmin();
  const { data: user, error } = await db.from("users").select("id").eq("email", email).maybeSingle();
  if (error) throw error;
  if (!user) return "ok";

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from("identity_mismatches")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_MISMATCHES_PER_HOUR) return "too_many_attempts";

  const { data: latest, error: latestError } = await db
    .from("annual_submissions")
    .select("answers")
    .eq("user_id", user.id)
    .order("cycle_year", { ascending: false })
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (latest?.answers?.birthday === birthday) return "ok";

  const { error: logError } = await db.from("identity_mismatches").insert({ email });
  if (logError) throw logError;
  return "mismatch";
}
