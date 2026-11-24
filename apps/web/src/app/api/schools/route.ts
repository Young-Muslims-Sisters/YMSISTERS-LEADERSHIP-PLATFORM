import { connection } from "next/server";
import { loadSchools } from "@/lib/server/reference";

// School list, loaded separately because it is too large to send with the page.
export async function GET() {
  await connection();
  return Response.json(await loadSchools(), { headers: { "Cache-Control": "public, max-age=3600" } });
}
