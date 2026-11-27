import type { ReferenceData } from "@/lib/form/reference-types";
import { Card, Label } from "../fields";
import { TagPicker } from "../TagPicker";
import type { ScreenProps } from "./shared";

export function SkillsScreen({ values, set, reference }: Omit<ScreenProps, "err"> & { reference: ReferenceData }) {
  return (
    <Card>
      <div>
        <Label id="skills-label" htmlFor="skills">Skills</Label>
        <TagPicker id="skills" labelledBy="skills-label" options={reference.tags.skill} value={values.skills}
          onChange={(v) => set("skills", v)} placeholder="Select skills or add your own" />
      </div>
      <div className="mt-6">
        <Label id="interests-label" htmlFor="interests">YM Interests</Label>
        <TagPicker id="interests" labelledBy="interests-label" options={reference.tags.interest} value={values.interests}
          onChange={(v) => set("interests", v)} placeholder="Pick what interests you, or add something you’d love to see or start" />
      </div>
    </Card>
  );
}
