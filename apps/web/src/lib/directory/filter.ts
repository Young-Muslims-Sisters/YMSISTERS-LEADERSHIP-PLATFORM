import { fullName, pills, type Person } from "./types";

export const FILTERS = [
  { key: "status", label: "Active Status" },
  { key: "location", label: "SR / Region" },
  { key: "neighborNet", label: "NeighborNet (NN)" },
  { key: "role", label: "Roles" },
  { key: "team", label: "Teams" },
  { key: "skill", label: "Skills" },
  { key: "interest", label: "YM Interests" },
  { key: "previous", label: "Previous Leadership" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];
export type Filters = Record<FilterKey, string[]>;

export const NO_FILTERS: Filters = {
  status: [], location: [], neighborNet: [], role: [], team: [], skill: [], interest: [], previous: [],
};

export function valuesFor(p: Person, key: FilterKey): string[] {
  switch (key) {
    case "status": return p.status ? [p.status] : [];
    case "location": return p.location ? [p.location] : [];
    case "neighborNet": return p.neighborNet ? [p.neighborNet] : [];
    case "role": return p.current.filter((c) => c.kind === "role").map((c) => c.name);
    case "team": return p.current.filter((c) => c.kind === "team").map((c) => c.name);
    case "skill": return p.tags.skill;
    case "interest": return p.tags.interest;
    case "previous": return p.previous.map((c) => c.name);
  }
}

export const SORTS = {
  "name-asc": "Name (A to Z)",
  "name-desc": "Name (Z to A)",
  location: "SR / Region (A to Z)",
  role: "Role (A to Z)",
  status: "Active status (Active first)",
} as const;
export type Sort = keyof typeof SORTS;

const searchText = (p: Person) =>
  [
    fullName(p), p.email, p.phone, p.phone?.replace(/\D/g, ""), p.state, p.location, p.neighborNet,
    ...p.current.flatMap((c) => [c.short, c.name]), ...p.previous.map((c) => c.name), ...Object.values(p.tags).flat(),
  ].join(" ").toLowerCase();

const STATUS_ORDER = { Active: 0, Cloud: 1 };

// Filter groups combine with AND; values inside a group with OR.
export function findPeople(people: Person[], search: string, filters: Filters, sort: Sort): Person[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const found = people.filter((p) => {
    const text = searchText(p);
    return (
      words.every((w) => text.includes(w)) &&
      FILTERS.every(({ key }) => filters[key].length === 0 || valuesFor(p, key).some((v) => filters[key].includes(v)))
    );
  });

  const byName = (a: Person, b: Person) => fullName(a).localeCompare(fullName(b));
  // "~" sorts people with no value last.
  const by = (pick: (p: Person) => string | null | undefined) => (a: Person, b: Person) =>
    (pick(a) ?? "~").localeCompare(pick(b) ?? "~") || byName(a, b);
  const order = {
    "name-asc": byName,
    "name-desc": (a: Person, b: Person) => byName(b, a),
    location: by((p) => p.location),
    role: by((p) => pills(p)[0]),
    status: (a: Person, b: Person) =>
      (a.status ? STATUS_ORDER[a.status] : 2) - (b.status ? STATUS_ORDER[b.status] : 2) || byName(a, b),
  };
  return found.sort(order[sort]);
}
