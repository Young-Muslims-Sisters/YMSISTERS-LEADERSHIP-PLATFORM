"use client";

import { useMemo, useState } from "react";
import type { Option } from "@/lib/form/reference-types";
import type { AnnualFormValues } from "@/lib/form/schema";
import { Combobox } from "./Combobox";
import { AddButton, Label, TextButton, TextField, inputClass } from "./fields";
import { toTag } from "./TagPicker";

type Entry = AnnualFormValues["organizations"][number];

// Each organization with the person's role and what they worked on.
export function OrganizationsField({ options, value, onChange }: {
  options: Option[]; value: Entry[]; onChange: (v: Entry[]) => void;
}) {
  const comboOptions = useMemo(() => options.map((o) => ({ value: o.id, label: o.label })), [options]);
  // An empty row waiting for an organization: always one when the list is empty.
  const [adding, setAdding] = useState(false);
  const showEmpty = adding || value.length === 0;
  const update = (i: number, patch: Partial<Entry>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  const picker = (i: number, current: Entry | null) => (
    <Combobox id={`organizations-${i}`} labelledBy={`organizations-${i}-label`} options={comboOptions} allowCustom
      selected={current ? { value: current.org.id ?? `custom:${current.org.label}`, label: current.org.label } : null}
      onSelect={(o) => {
        if (!o) return current && remove(i);
        const org = toTag(o, options);
        if (current) return update(i, { org });
        onChange([...value, { org, role: "", details: "" }]);
        setAdding(false);
      }}
      placeholder="Search organizations or add your own" />
  );

  return (
    <div className="grid gap-4">
      {value.map((r, i) => {
        const id = `organizations-${i}`;
        return (
          <div key={i} className="grid gap-4 rounded-[12px] border-[1.5px] border-sage-200 bg-white p-[15.5px]">
            <div>
              <div className="flex items-center justify-between">
                <Label id={`${id}-label`} htmlFor={id}>Organization</Label>
                <TextButton aria-label={`Remove ${r.org.label}`} onClick={() => remove(i)}>Remove</TextButton>
              </div>
              {picker(i, r)}
            </div>
            <TextField id={`${id}-role`} label="Your role" maxLength={100} placeholder="e.g. President, Volunteer, Member"
              value={r.role} onChange={(e) => update(i, { role: e.target.value })} />
            <div>
              <Label htmlFor={`${id}-details`}>How were you involved?</Label>
              <textarea id={`${id}-details`} rows={3} maxLength={1000} value={r.details}
                onChange={(e) => update(i, { details: e.target.value })}
                placeholder="What you worked on or helped organize"
                className={`${inputClass} h-auto min-h-[90px] resize-y py-3`} />
            </div>
          </div>
        );
      })}
      {showEmpty && (
        <div className="rounded-[12px] border-[1.5px] border-sage-200 bg-white p-[15.5px]">
          <div className="flex items-center justify-between">
            <Label id={`organizations-${value.length}-label`} htmlFor={`organizations-${value.length}`}>Organization</Label>
            {value.length > 0 && <TextButton onClick={() => setAdding(false)}>Remove</TextButton>}
          </div>
          {picker(value.length, null)}
        </div>
      )}
      <div>
        <AddButton onClick={() => setAdding(true)} disabled={showEmpty || value.length >= 20}>+ Add Organization</AddButton>
      </div>
    </div>
  );
}
