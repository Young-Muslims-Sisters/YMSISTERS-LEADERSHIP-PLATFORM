import "server-only";
import type { Person, Position, PrivateDetails, TagKind } from "@/lib/directory/types";
import { env } from "./env";
import { supabaseSession } from "./supabase-session";

type Named = { name: string } | null;
export type RoleRow = {
  is_current: boolean;
  from_year: number | null;
  to_year: number | null;
  superseded_at: string | null;
  team_title: string | null;
  title_detail: string | null;
  description: string | null;
  role_type: Named;
  team: Named;
  portfolio: Named;
  region: Named;
  subregion: Named;
  neighbor_net: Named;
};
type UserRow = {
  id: string; first_name: string; last_name: string; email: string; phone: string | null; state: string | null;
  involvement: string | null; involvement_year: number | null;
  region: Named; subregion: Named; neighbor_net: Named;
  roles: RoleRow[];
  tags: { role: string | null; details: string | null; tag: { kind: TagKind; label: string } | null }[];
};
type PrivateRow = {
  user_id: string; ym_email: string | null; ym_email_status: string | null;
  address_line1: string | null; address_line2: string | null; city: string | null; state: string | null; postal_code: string | null;
};

export const ROLE_COLUMNS =
  "is_current, from_year, to_year, superseded_at, team_title, title_detail, description, role_type:role_types(name), " +
  "team:teams!role_assignments_team_id_fkey(name), portfolio:teams!role_assignments_portfolio_team_id_fkey(name), " +
  "region:regions(name), subregion:subregions(name), neighbor_net:neighbor_nets(name)";
const COLUMNS =
  "id, first_name, last_name, email, phone, state, involvement, involvement_year, region:regions(name), subregion:subregions(name), neighbor_net:neighbor_nets(name), " +
  `roles:role_assignments(${ROLE_COLUMNS}), tags:user_profile_tags(role, details, tag:profile_tags(kind, label))`;

const PAGE_SIZE = 1000;

const TITLES: Record<string, string> = { chair: "Chair", co_chair: "Co-Chair", lead: "Lead", member: "Member" };

function detailOf(r: RoleRow): string | null {
  if (r.role_type) return r.portfolio?.name ?? r.title_detail;
  if (r.team_title === "lead") return r.title_detail ? `${r.title_detail} Lead` : "Lead";
  if (r.team_title === "other") return r.title_detail;
  return r.team_title ? TITLES[r.team_title] : null;
}

export function toPosition(r: RoleRow): Position {
  const name = r.role_type?.name ?? r.team?.name ?? "Position";
  return {
    name,
    short: name.match(/\(([A-Z]+)\)$/)?.[1] ?? name,
    kind: r.role_type ? "role" : "team",
    detail: detailOf(r),
    description: r.description,
    place: r.neighbor_net?.name ?? r.subregion?.name ?? r.region?.name ?? (r.team ? "National Team" : null),
    fromYear: r.from_year,
    toYear: r.to_year,
  };
}

function toPrivate(p: PrivateRow | undefined): PrivateDetails | null {
  if (!p) return null;
  const street = [p.address_line1, p.address_line2].filter(Boolean).join(", ");
  const place = [p.city, [p.state, p.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return { ymEmail: p.ym_email, ymEmailStatus: p.ym_email_status, address: [street, place].filter(Boolean).join(", ") || null };
}

function toPerson(u: UserRow, privateRow?: PrivateRow): Person {
  const live = u.roles.filter((r) => !r.superseded_at);
  const tags: Person["tags"] = { skill: [], interest: [], school: [], field_of_study: [], occupation: [], organization: [] };
  for (const { tag } of u.tags) if (tag) tags[tag.kind].push(tag.label);
  const organizations = u.tags
    .flatMap(({ tag, role, details }) => (tag?.kind === "organization" ? [{ name: tag.label, role, details }] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
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
    organizations,
    private: toPrivate(privateRow),
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
    if (data.length < PAGE_SIZE) break;
  }
  const details = await loadPrivateDetails();
  return rows.map((u) => toPerson(u, details.get(u.id)));
}

// YM email and address. Database rules return rows to IT and the National Shura only.
async function loadPrivateDetails(): Promise<Map<string, PrivateRow>> {
  const db = await supabaseSession();
  const rows: PrivateRow[] = [];
  for (;;) {
    const { data, error } = await db
      .from("user_private_details")
      .select("user_id, ym_email, ym_email_status, address_line1, address_line2, city, state, postal_code")
      .order("user_id").range(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return new Map(rows.map((r) => [r.user_id, r]));
  }
}
