import { ETHNICITY_OPTIONS } from "@/lib/form/options";
import type { TagValue } from "@/lib/form/schema";
import { Card, Label, TextField } from "../fields";
import { TagPicker } from "../TagPicker";
import type { ScreenProps } from "./shared";

// Ethnicity is stored as plain labels; ids only exist for the picker.
const ETHNICITIES = ETHNICITY_OPTIONS.map((label) => ({ id: label, label }));
const toEthnicityTag = ({ label }: TagValue): TagValue =>
  ETHNICITY_OPTIONS.includes(label) ? { id: label, label } : { label };

export function PersonalScreen({ values, set, err }: ScreenProps) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card>
      <div className="grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
        <TextField id="firstName" label="First Name" required autoComplete="given-name" placeholder="First name"
          value={values.firstName} onChange={(e) => set("firstName", e.target.value)} error={err("firstName")} />
        <TextField id="lastName" label="Last Name" required autoComplete="family-name" placeholder="Last name"
          value={values.lastName} onChange={(e) => set("lastName", e.target.value)} error={err("lastName")} />
        <TextField id="birthday" label="Date of Birth" required type="date" autoComplete="bday" max={today}
          value={values.birthday} onChange={(e) => set("birthday", e.target.value)} error={err("birthday")} />
        <div>
          <Label id="ethnicity-label" htmlFor="ethnicity">Ethnicity</Label>
          <TagPicker id="ethnicity" labelledBy="ethnicity-label" options={ETHNICITIES}
            value={values.ethnicity.map(toEthnicityTag)}
            onChange={(v) => set("ethnicity", v.map((t) => ({ label: t.label })))}
            placeholder="Select all that apply" />
        </div>
      </div>
    </Card>
  );
}
