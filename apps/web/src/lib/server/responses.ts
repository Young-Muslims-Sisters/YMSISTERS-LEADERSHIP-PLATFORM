import "server-only";
import type { EmailStatus, Response } from "@/lib/admin/types";
import { ROLE_COLUMNS, toPosition, type RoleRow } from "./directory";
import { env } from "./env";
import { supabaseSession } from "./supabase-session";

type Named = { name: string } | null;
type Labels = { label: string }[];
type Row = {
  id: string;
  user_id: string;
  revision: number;
  involvement: string;
  submitted_at: string;
  identity_match: string;
  answers: {
    birthday?: string;
    ethnicity?: string[];
    education_status?: string[];
    anything_else?: string | null;
    submitted?: {
      firstName: string; lastName: string; email: string; phone: string; state: string;
      skills: Labels; interests: Labels; schools: Labels; fieldsOfStudy: Labels; organizations: Labels;
      occupation: { label: string } | null;
    };
  };
  person: { first_name: string; last_name: string; email: string; phone: string | null; state: string | null; region: Named; subregion: Named; neighbor_net: Named };
  roles: RoleRow[];
  deliveries: { status: EmailStatus; recipient_email: string | null; last_error: string | null; subregion: Named }[];
};

const COLUMNS =
  "id, user_id, revision, involvement, submitted_at, identity_match, answers, " +
  "person:users!annual_submissions_user_id_fkey(first_name, last_name, email, phone, state, region:regions(name), subregion:subregions(name), neighbor_net:neighbor_nets(name)), " +
  `roles:role_assignments(${ROLE_COLUMNS}), deliveries:notification_deliveries(status, recipient_email, last_error, subregion:subregions(name))`;

const PAGE_SIZE = 1000;
const labels = (list?: Labels) => (list ?? []).map((t) => t.label);

function toResponse(r: Row): Response {
  const { submitted: s } = r.answers;
  const delivery = r.deliveries[0];
  const positions = r.roles.map((role) => ({ ...toPosition(role), isCurrent: role.is_current }));
  return {
    id: r.id,
    userId: r.user_id,
    name: `${s?.firstName ?? r.person.first_name} ${s?.lastName ?? r.person.last_name}`,
    email: s?.email ?? r.person.email,
    phone: s?.phone ?? r.person.phone,
    state: s?.state ?? r.person.state,
    location: r.person.subregion?.name ?? r.person.region?.name ?? null,
    neighborNet: r.person.neighbor_net?.name ?? null,
    involvement: r.involvement === "cloud" ? "Cloud" : "Active",
    revision: r.revision,
    submittedAt: r.submitted_at,
    possibleDuplicate: r.identity_match === "possible_duplicate",
    current: positions.filter((p) => p.isCurrent),
    previous: positions.filter((p) => !p.isCurrent),
    emailStatus: delivery?.status ?? "no_route",
    emailRecipient: delivery?.recipient_email ?? null,
    emailError: delivery?.last_error ?? null,
    birthday: r.answers.birthday ?? null,
    ethnicity: r.answers.ethnicity ?? [],
    educationStatus: r.answers.education_status ?? [],
    skills: labels(s?.skills),
    interests: labels(s?.interests),
    schools: labels(s?.schools),
    fieldsOfStudy: labels(s?.fieldsOfStudy),
    occupation: s?.occupation?.label ?? null,
    organizations: labels(s?.organizations),
    anythingElse: r.answers.anything_else ?? null,
  };
}

// This year's submissions, newest first. Database rules return rows to IT only.
export async function loadResponses(): Promise<{ responses: Response[]; profileCount: number }> {
  const db = await supabaseSession();
  const { count, error: countError } = await db.from("users").select("id", { count: "exact", head: true });
  if (countError) throw countError;

  const rows: Row[] = [];
  for (;;) {
    const { data, error } = await db
      .from("annual_submissions").select(COLUMNS).eq("cycle_year", env.cycleYear)
      .order("submitted_at", { ascending: false }).order("id")
      .range(rows.length, rows.length + PAGE_SIZE - 1)
      .overrideTypes<Row[], { merge: false }>();
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return { responses: rows.map(toResponse), profileCount: count ?? 0 };
  }
}
