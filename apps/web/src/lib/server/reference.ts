import "server-only";
import type { Option, ReferenceData } from "@/lib/form/reference-types";
import { supabaseAdmin } from "./supabase-admin";

// Loads the form's dropdown lists, except schools. Only approved, active entries; no SRC addresses.
export async function loadReferenceData(): Promise<ReferenceData> {
  const db = supabaseAdmin();
  const [regions, subregions, neighborNets, roleTypes, teams, tags] = await Promise.all([
    db.from("regions").select("id, name").order("name"),
    db.from("subregions").select("id, name").order("name"),
    db.from("neighbor_nets").select("id, name, subregion_id, region_id, state").order("state").order("name"),
    db.from("role_types").select("id, name, scope_level, has_portfolio").eq("is_active", true).order("sort_order").order("name"),
    db.from("teams").select("id, name").eq("is_active", true).order("name"),
    db.from("profile_tags").select("id, kind, label").neq("kind", "school").eq("is_active", true).eq("is_approved", true).order("label"),
  ]);
  for (const r of [regions, subregions, neighborNets, roleTypes, teams, tags]) if (r.error) throw r.error;

  const byKind: ReferenceData["tags"] = {
    skill: [], interest: [], field_of_study: [], occupation: [], organization: [],
  };
  for (const t of tags.data!) byKind[t.kind as keyof ReferenceData["tags"]]?.push({ id: t.id, label: t.label });

  return {
    regions: regions.data!.map((r) => ({ id: r.id, label: r.name })),
    subregions: subregions.data!.map((s) => ({ id: s.id, label: s.name })),
    neighborNets: neighborNets.data!.map((n) => ({ id: n.id, label: n.name, parentId: n.subregion_id ?? n.region_id, state: n.state })),
    roleTypes: roleTypes.data!.map((r) => ({ id: r.id, label: r.name, scopeLevel: r.scope_level, hasPortfolio: r.has_portfolio })),
    teams: teams.data!.map((t) => ({ id: t.id, label: t.name })),
    tags: byKind,
  };
}

// Supabase returns at most 1,000 rows per request.
const PAGE_SIZE = 1000;

export async function loadSchools(): Promise<Option[]> {
  const schools: Option[] = [];
  for (;;) {
    const { data, error } = await supabaseAdmin()
      .from("profile_tags").select("id, label")
      .eq("kind", "school").eq("is_active", true).eq("is_approved", true)
      .order("label").order("id").range(schools.length, schools.length + PAGE_SIZE - 1);
    if (error) throw error;
    schools.push(...data);
    if (data.length < PAGE_SIZE) return schools;
  }
}
