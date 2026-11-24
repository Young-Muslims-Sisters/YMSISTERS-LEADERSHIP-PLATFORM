import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "./env";

// Client acting as the signed-in person, so database access rules apply.
export async function supabaseSession() {
  await connection(); // Sessions are checked on every request, never prerendered.
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Pages cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
