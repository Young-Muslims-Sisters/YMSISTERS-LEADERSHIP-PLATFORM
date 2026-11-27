"use server";

import { z } from "zod";
import { fullName, positionLabel } from "@/lib/directory/types";
import { requireMember } from "@/lib/server/access";
import { loadDirectory } from "@/lib/server/directory";

// Quotes a value, and stops spreadsheets from running text that looks like a formula.
function cell(value: string | null) {
  const text = value ?? "";
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

// Builds the CSV on the server from what this person may see. Null exports everyone.
export async function exportCsv(ids: string[] | null): Promise<string> {
  await requireMember();
  const wanted = z.array(z.guid()).max(10_000).nullable().parse(ids);
  const people = await loadDirectory();
  const byId = new Map(people.map((p) => [p.id, p]));
  const chosen = wanted ? wanted.flatMap((id) => byId.get(id) ?? []) : people;

  const header = ["Name", "Roles", "Email", "Phone", "State", "SR / Region", "NeighborNet", "Status", "Skills", "YM Interests"];
  const rows = chosen.map((p) => [
    fullName(p), p.current.map(positionLabel).join("; "), p.email, p.phone, p.state, p.location, p.neighborNet, p.status,
    p.tags.skill.join("; "), p.tags.interest.join("; "),
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
