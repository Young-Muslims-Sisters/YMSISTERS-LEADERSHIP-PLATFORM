"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireItAdmin } from "@/lib/server/access";
import { supabaseSession } from "@/lib/server/supabase-session";

// Permanently removes a person and all their responses. The database checks IT access again.
export async function deletePerson(userId: string): Promise<{ ok: boolean }> {
  await requireItAdmin();
  const id = z.guid().parse(userId);
  const db = await supabaseSession();
  const { error } = await db.rpc("delete_person", { person_id: id });
  // P0002: already deleted, so only the list needs refreshing.
  if (error && error.code !== "P0002") {
    console.error("[admin] deletePerson failed", error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}
