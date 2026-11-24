import "server-only";
import { redirect } from "next/navigation";
import { env } from "./env";
import { supabaseSession } from "./supabase-session";

export type Access = "none" | "member" | "it_admin";

// Asks the database what the signed-in person may open.
export async function getAccess(): Promise<Access> {
  const db = await supabaseSession();
  const { data: { session } } = await db.auth.getSession();
  if (!session) return "none";
  const { data, error } = await db.rpc("my_access");
  if (error) throw error;
  return data as Access;
}

export async function requireMember(): Promise<Access> {
  const access = await getAccess();
  if (access === "none") redirect("/login?next=/directory");
  return access;
}

export async function requireItAdmin(): Promise<Access> {
  const access = await getAccess();
  if (access === "none") redirect("/login?next=/admin");
  if (access !== "it_admin") redirect("/directory");
  return access;
}

// Test sign-in buttons exist only in development against the local database.
export function localLoginEnabled(): boolean {
  const host = new URL(env.supabaseUrl).hostname;
  return process.env.NODE_ENV !== "production" && (host === "127.0.0.1" || host === "localhost");
}

// Where to go after signing in. Only known pages, never an outside link.
export function safeNext(next: unknown): "/directory" | "/admin" {
  return next === "/admin" ? "/admin" : "/directory";
}
