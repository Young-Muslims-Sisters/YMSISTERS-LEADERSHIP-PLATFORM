// Reference lists the form needs, shaped for the browser (no sensitive data).

export type Option = { id: string; label: string };

export type ReferenceData = {
  regions: Option[];
  subregions: Option[];
  // Belongs to a subregion or a region; region NeighborNets are grouped by state.
  neighborNets: (Option & { parentId: string; state: string | null })[];
  roleTypes: (Option & { scopeLevel: "national" | "region" | "subregion" | "neighbor_net" | "other" })[];
  teams: Option[];
  tags: {
    skill: Option[];
    interest: Option[];
    field_of_study: Option[];
    occupation: Option[];
    organization: Option[];
  };
};
