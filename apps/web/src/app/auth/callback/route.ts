import { NextResponse, type NextRequest } from "next/server";
import { getAccess, safeNext } from "@/lib/server/access";
import { supabaseSession } from "@/lib/server/supabase-session";

// Google sends people back here. Anyone without YM access is signed out again.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const code = searchParams.get("code");
  if (!code) return to("/login?error=failed");
  const db = await supabaseSession();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) return to("/login?error=failed");

  if ((await getAccess()) === "none") {
    await db.auth.signOut({ scope: "local" });
    return to("/login?error=access");
  }
  return to(safeNext(searchParams.get("next")));
}
