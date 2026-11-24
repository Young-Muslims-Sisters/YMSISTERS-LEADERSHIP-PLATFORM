import { useMemo } from "react";
import { EDUCATION_STATUSES } from "@/lib/form/options";
import type { ReferenceData } from "@/lib/form/reference-types";
import { Combobox } from "../Combobox";
import { Card, Label } from "../fields";
import { RepeatableTagField } from "../RepeatableTagField";
import { TagPicker, toTag } from "../TagPicker";
import { useSchools } from "../useSchools";
import type { ScreenProps } from "./shared";

export function EducationScreen({ values, set, reference }: Omit<ScreenProps, "err"> & { reference: ReferenceData }) {
  const schools = useSchools();
  const toggle = (s: string) =>
    set("educationStatus", values.educationStatus.includes(s) ? values.educationStatus.filter((x) => x !== s) : [...values.educationStatus, s]);
  const occupationOptions = useMemo(() => reference.tags.occupation.map((o) => ({ value: o.id, label: o.label })), [reference]);
  return (
    <Card>
      <fieldset>
        <legend className="mb-[18px] text-[14px] font-semibold text-ink">Current Education / Work Status</legend>
        <div className="flex flex-wrap gap-[10px]">
          {EDUCATION_STATUSES.map((s) => {
            const on = values.educationStatus.includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)}
                className={`h-[35px] rounded-[19px] px-[14px] text-[12px] ${
                  on ? "border-[1.6px] border-forest-600 bg-forest-600 font-semibold text-white" : "border-[1.6px] border-sage-300 bg-white text-ink hover:bg-mint-25"
                }`}>
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-8">
        <RepeatableTagField id="schools" label="School / University" options={schools} value={values.schools}
          onChange={(v) => set("schools", v)} placeholder="Search schools or add your own" addLabel="+ Add School" />
      </div>
      <div className="mt-[26px] grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
        <div>
          <Label id="fieldsOfStudy-label" htmlFor="fieldsOfStudy">Field(s) of Study</Label>
          <TagPicker id="fieldsOfStudy" labelledBy="fieldsOfStudy-label" options={reference.tags.field_of_study}
            value={values.fieldsOfStudy} onChange={(v) => set("fieldsOfStudy", v)} placeholder="Search fields or add your own" />
        </div>
        <div>
          <Label id="occupation-label" htmlFor="occupation">Occupation</Label>
          <Combobox id="occupation" labelledBy="occupation-label" options={occupationOptions} allowCustom
            selected={values.occupation ? { value: values.occupation.id ?? `custom:${values.occupation.label}`, label: values.occupation.label } : null}
            onSelect={(o) => set("occupation", o ? toTag(o, reference.tags.occupation) : null)}
            placeholder="Search occupations or add your own" />
        </div>
      </div>
    </Card>
  );
}
