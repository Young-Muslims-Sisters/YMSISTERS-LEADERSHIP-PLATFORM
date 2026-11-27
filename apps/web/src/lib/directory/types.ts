// Directory data sent to the browser. Never birthday, ethnicity or raw answers.

export type Position = {
  // "SRC" for "Subregional Coordinator (SRC)"; otherwise the full name.
  short: string;
  name: string;
  kind: "role" | "team";
  // Shura portfolio or position on a team, e.g. "Tarbiyyah" or "Logistics Lead".
  detail: string | null;
  // What they did, for previous positions.
  description: string | null;
  place: string | null;
  fromYear: number | null;
  toYear: number | null;
};

export type TagKind = "skill" | "interest" | "school" | "field_of_study" | "occupation" | "organization";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  state: string | null;
  location: string | null;
  neighborNet: string | null;
  // Null when this person has not submitted the current year's form.
  status: "Active" | "Cloud" | null;
  current: Position[];
  previous: Position[];
  tags: Record<TagKind, string[]>;
  organizations: { name: string; role: string | null; details: string | null }[];
  // Only filled in for IT and the National Shura.
  private: PrivateDetails | null;
};

export type PrivateDetails = { ymEmail: string | null; ymEmailStatus: string | null; address: string | null };

export const YM_EMAIL_STATUS: Record<string, string> = { has: "Has one", needs: "Needs one created" };

// "SubRegional Shura · Tarbiyyah"
export const positionLabel = (p: Pick<Position, "name" | "detail">) => (p.detail ? `${p.name} · ${p.detail}` : p.name);

export const fullName = (p: Pick<Person, "firstName" | "lastName">) => `${p.firstName} ${p.lastName}`;

// Role pills: current positions, or the most recent past one.
export function pills(p: Person): string[] {
  if (p.current.length > 0) return p.current.map((c) => c.short);
  return p.previous.length > 0 ? [`Former ${p.previous[0].short}`] : [];
}
