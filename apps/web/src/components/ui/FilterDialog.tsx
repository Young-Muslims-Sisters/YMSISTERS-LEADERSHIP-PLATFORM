"use client";

import { useState } from "react";
import { Combobox, type ComboOption } from "@/components/form/Combobox";
import { Label, SelectedChip } from "@/components/form/fields";
import { primaryButton, secondaryButton } from "./buttons";
import { Dialog } from "./Dialog";

type Props<K extends string> = {
  title: string;
  fields: readonly { key: K; label: string }[];
  options: (draft: Record<K, string[]>) => Record<K, ComboOption[]>;
  value: Record<K, string[]>;
  onApply: (value: Record<K, string[]>) => void;
  onClose: () => void;
};

export function FilterDialog<K extends string>({ title, fields, options, value, onApply, onClose }: Props<K>) {
  const [draft, setDraft] = useState(value);
  const toggle = (key: K, v: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));
  const choices = options(draft);
  const clear = () => setDraft(Object.fromEntries(fields.map((f) => [f.key, []])) as unknown as Record<K, string[]>);

  return (
    <Dialog title={title} variant="modal" onClose={onClose}>
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <Label id={`filter-${key}-label`} htmlFor={`filter-${key}`}>{label}</Label>
            <Combobox
              id={`filter-${key}`}
              labelledBy={`filter-${key}-label`}
              options={choices[key]}
              flip
              selected={null}
              selectedValues={new Set(draft[key])}
              chips={draft[key].map((v) => <SelectedChip key={v} label={v} onRemove={() => toggle(key, v)} />)}
              onSelect={(o) => (o ? toggle(key, o.value) : setDraft((d) => ({ ...d, [key]: d[key].slice(0, -1) })))}
              placeholder="All"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
        <button type="button" onClick={clear} className={secondaryButton}>Clear all</button>
        <button type="button" onClick={() => onApply(draft)} className={primaryButton}>Show results</button>
      </div>
    </Dialog>
  );
}
