import "server-only";
import type { Person, Position, TagKind } from "@/lib/directory/types";
import { env } from "./env";
import { supabaseSession } from "./supabase-session";

type Named = { name: string } | null;
export type RoleRow = {
  is_current: boolean;
  from_year: number | null;
  to_year: number | null;
  superseded_at: string | null;
  role_type: Named;
  team: Named;
  region: Named;
  subregion: Named;
  neighbor_net: Named;
};
type UserRow = {
  id: string; first_name: string; last_name: string; email: string; phone: string | null; state: string | null;
  involvement: string | null; involvement_year: number | null;
  region: Named; subregion: Named; neighbor_net: Named;
  roles: RoleRow[];
  tags: { tag: { kind: TagKind; label: string } | null }[];
};

export const ROLE_COLUMNS =
  "is_current, from_year, to_year, superseded_at, role_type:role_types(name), team:teams(name), region:regions(name), subregion:subregions(name), neighbor_net:neighbor_nets(name)";
const COLUMNS =
  "id, first_name, last_name, email, phone, state, involvement, involvement_year, region:regions(name), subregion:subregions(name), neighbor_net:neighbor_nets(name), " +
  `roles:role_assignments(${ROLE_COLUMNS}), tags:user_profile_tags(tag:profile_tags(kind, label))`;

const PAGE_SIZE = 1000;

export function toPosition(r: RoleRow): Position {
  const name = r.role_type?.name ?? r.team?.name ?? "Position";
  return {
    name,
    short: name.match(/\(([A-Z]+)\)$/)?.[1] ?? name,
    kind: r.role_type ? "role" : "team",
    place: r.neighbor_net?.name ?? r.subregion?.name ?? r.region?.name ?? (r.team ? "National Team" : null),
    fromYear: r.from_year,
    toYear: r.to_year,
  };
}

function toPerson(u: UserRow): Person {
  const live = u.roles.filter((r) => !r.superseded_at);
  const tags: Person["tags"] = { skill: [], interest: [], school: [], field_of_study: [], occupation: [], organization: [] };
  for (const { tag } of u.tags) if (tag) tags[tag.kind].push(tag.label);
  for (const list of Object.values(tags)) list.sort((a, b) => a.localeCompare(b));
  const isCurrent = u.involvement_year === env.cycleYear;
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    phone: u.phone,
    state: u.state,
    location: u.subregion?.name ?? u.region?.name ?? null,
    neighborNet: u.neighbor_net?.name ?? null,
    status: !isCurrent ? null : u.involvement === "cloud" ? "Cloud" : "Active",
    current: live.filter((r) => r.is_current).map(toPosition),
    previous: live
      .filter((r) => !r.is_current)
      .map(toPosition)
      .sort((a, b) => (b.toYear ?? b.fromYear ?? 0) - (a.toYear ?? a.fromYear ?? 0)),
    tags,
  };
}

// Everyone the signed-in person may see. Database rules decide, so others get nothing.
export async function loadDirectory(): Promise<Person[]> {
  const db = await supabaseSession();
  const rows: UserRow[] = [];
  for (;;) {
    const { data, error } = await db
      .from("users").select(COLUMNS).order("last_name").order("id")
      .range(rows.length, rows.length + PAGE_SIZE - 1)
      .overrideTypes<UserRow[], { merge: false }>();
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows.map(toPerson);
  }
}
