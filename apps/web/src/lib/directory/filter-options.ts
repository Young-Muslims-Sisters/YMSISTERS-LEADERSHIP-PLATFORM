import type { ComboOption } from "@/components/form/Combobox";
import { locationOptions, positionOptions } from "@/components/form/screens/shared";
import type { ReferenceData } from "@/lib/form/reference-types";
import { valuesFor, type FilterKey, type Filters } from "./filter";
import type { Person } from "./types";

// The same full, grouped lists as the form, plus anything people typed in themselves.
export function filterOptions(people: Person[], reference: ReferenceData) {
  const inUse = (key: FilterKey) =>
    [...new Set(people.flatMap((p) => valuesFor(p, key)))].sort((a, b) => a.localeCompare(b));
  const withInUse = (key: FilterKey, options: ComboOption[]) => {
    const listed = new Set(options.map((o) => o.value));
    const extra = inUse(key).filter((v) => !listed.has(v));
    const group = options.some((o) => o.group) ? "Other" : undefined;
    return [...options, ...extra.map((v) => ({ value: v, label: v, group }))];
  };
  // Filters match on names, so each option's value is its label.
  const byName = (options: ComboOption[]) => options.map((o) => ({ ...o, value: o.label }));
  const plain = (options: { label: string }[]) => options.map((o) => ({ value: o.label, label: o.label }));

  const positions = positionOptions(reference);
  const roles = byName(positions.filter((o) => o.value.startsWith("role:")));
  const teams = byName(positions.filter((o) => o.value.startsWith("team:"))).map(({ value, label }) => ({ value, label }));

  const places = [...reference.subregions, ...reference.regions];
  const neighborNets = places.flatMap((place) =>
    reference.neighborNets
      .filter((n) => n.parentId === place.id)
      .map((n) => ({ value: n.label, label: n.label, place: place.label, group: n.state ? `${place.label}: ${n.state}` : place.label })),
  );

  const fixed = {
    status: plain([{ label: "Active" }, { label: "Cloud" }]),
    location: withInUse("location", byName(locationOptions(reference))),
    role: withInUse("role", roles),
    team: withInUse("team", teams),
    skill: withInUse("skill", plain(reference.tags.skill)),
    interest: withInUse("interest", plain(reference.tags.interest)),
    previous: withInUse("previous", byName(positions)),
  };
  const allNeighborNets = withInUse("neighborNet", neighborNets);

  // Choosing an SR / Region narrows the NeighborNets, as in the form.
  return (draft: Filters): Record<FilterKey, ComboOption[]> => ({
    ...fixed,
    neighborNet:
      draft.location.length > 0 ? neighborNets.filter((n) => draft.location.includes(n.place)) : allNeighborNets,
  });
}
