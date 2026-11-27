import type { ReferenceData } from "@/lib/form/reference-types";
import type { AnnualFormValues } from "@/lib/form/schema";
import type { ComboOption } from "../Combobox";

export type Screen =
  | "personal" | "contact" | "location" | "involvement" | "current" | "previous"
  | "skills" | "education" | "connections" | "review";

export type ScreenProps = {
  values: AnnualFormValues;
  set: <K extends keyof AnnualFormValues>(key: K, value: AnnualFormValues[K]) => void;
  err: (path: string) => string | undefined;
};

// Turns a field path ("previousPositions.0.toYear") into a DOM id.
export const fieldId = (path: string) => path.replaceAll(".", "-");

export const describe = (id: string, error?: string) => (error ? `${id}-error` : undefined);

export function locationOptions(reference: ReferenceData): ComboOption[] {
  return [
    ...reference.subregions.map((s) => ({ value: `subregion:${s.id}`, label: s.label, group: "Subregions" })),
    ...reference.regions.map((r) => ({ value: `region:${r.id}`, label: r.label, group: "Regions" })),
  ];
}

export function positionOptions(reference: ReferenceData): ComboOption[] {
  const group: Record<string, string> = {
    neighbor_net: "NeighborNet (NN)", subregion: "Subregion (SR)", region: "Region", national: "National", other: "Other",
  };
  const order = ["neighbor_net", "subregion", "region", "national"];
  const roles = (scopes: string[]) =>
    reference.roleTypes
      .filter((r) => scopes.includes(r.scopeLevel))
      .map((r) => ({ value: `role:${r.id}`, label: r.label, group: group[r.scopeLevel] }));
  return [
    ...order.flatMap((s) => roles([s])),
    ...reference.teams.map((t) => ({ value: `team:${t.id}`, label: t.label, group: "National departments & teams" })),
    ...roles(["other"]),
  ];
}
