import "server-only";
import type { ParsedAnnualForm, TagValue } from "@/lib/form/schema";
import { supabaseAdmin } from "./supabase-admin";

type ScopeLevel = "national" | "region" | "subregion" | "neighbor_net" | "other";

// Maps the form to the submit_annual_form database function.
export async function buildSubmissionPayload(form: ParsedAnnualForm, cycleYear: number) {
  const db = supabaseAdmin();

  // Resolve the location to region/subregion ids (the RPC re-checks consistency).
  const location = form.location!;
  const regionId = location.kind === "region" ? location.id : null;
  const subregionId = location.kind === "subregion" ? location.id : null;

  // Role scope decides which of the person's locations a position applies to.
  const { data: roles, error } = await db.from("role_types").select("id, scope_level");
  if (error) throw error;
  const scopeOf = new Map(roles.map((r) => [r.id as string, r.scope_level as ScopeLevel]));

  type Details = { portfolio: { id?: string; label: string } | null; teamTitle: string | null; titleDetail: string };
  const toPosition = (ref: string, d: Details) => {
    const [kind, id] = ref.split(":");
    if (kind === "team") {
      const detail = d.teamTitle === "lead" || d.teamTitle === "other" ? d.titleDetail : "";
      return { team_id: id, team_title: d.teamTitle, title_detail: detail || null };
    }
    const scope = scopeOf.get(id);
    return {
      // A portfolio from the department list, or typed in.
      portfolio_team_id: d.portfolio?.id ?? null,
      title_detail: d.portfolio && !d.portfolio.id ? d.portfolio.label : null,
      role_type_id: id,
      region_id: scope === "region" ? regionId : null,
      subregion_id: scope === "subregion" ? subregionId : null,
      neighbor_net_id: scope === "neighbor_net" ? form.neighborNetId : null,
    };
  };

  const isActive = form.involvement === "active_leadership";
  const current = isActive
    ? form.currentPositions.flatMap((p) => (p.position ? [toPosition(p.position, p)] : []))
    : [];
  const previous = form.noPreviousPositions
    ? []
    : form.previousPositions.flatMap((p) =>
        p.position
          ? [{ ...toPosition(p.position, p), description: p.description || null, from_year: p.fromYear || null, to_year: p.toYear || null }]
          : [],
      );

  const tag = (kind: string) => (t: TagValue) => (t.id ? { kind, id: t.id } : { kind, label: t.label });
  const tags = [
    ...form.skills.map(tag("skill")),
    ...form.interests.map(tag("interest")),
    ...form.schools.map(tag("school")),
    ...form.fieldsOfStudy.map(tag("field_of_study")),
    ...(form.occupation ? [tag("occupation")(form.occupation)] : []),
    ...form.organizations.map((o) => ({ ...tag("organization")(o.org), role: o.role || null, details: o.details || null })),
  ];

  return {
    cycle_year: cycleYear,
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    state: form.state,
    region_id: regionId,
    subregion_id: subregionId,
    neighbor_net_id: form.neighborNetId,
    involvement: form.involvement,
    current_positions: current,
    previous_positions: previous,
    tags,
    // YM email and mailing address: IT and National Shura only.
    private: {
      ym_email_status: form.ymEmailStatus,
      ym_email: form.ymEmailStatus === "has" ? form.ymEmail : null,
      address_line1: form.addressLine1, address_line2: form.addressLine2, city: form.city,
      state: form.addressState, postal_code: form.postalCode,
    },
    // Full answers, including sensitive ones, are kept IT-only on the submission.
    answers: {
      form_version: "2027-final-option-a",
      birthday: form.birthday,
      ethnicity: form.ethnicity.map((e) => e.label),
      education_status: form.educationStatus,
      anything_else: form.anythingElse || null,
      no_previous_positions: form.noPreviousPositions,
      submitted: form,
    },
  };
}

export async function submitAnnualForm(form: ParsedAnnualForm, cycleYear: number) {
  const payload = await buildSubmissionPayload(form, cycleYear);
  const { data, error } = await supabaseAdmin().rpc("submit_annual_form", { payload });
  if (error) throw error;
  return data as { submission_id: string; notification_status: string };
}
