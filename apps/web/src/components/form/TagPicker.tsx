"use client";

import { useMemo } from "react";
import type { Option } from "@/lib/form/reference-types";
import type { TagValue } from "@/lib/form/schema";
import { Combobox, isCustomOption, type ComboOption } from "./Combobox";
import { SelectedChip } from "./fields";

type Props = {
  id: string;
  options: readonly Option[];
  value: TagValue[];
  onChange: (value: TagValue[]) => void;
  placeholder: string;
  labelledBy?: string;
};

const keyOf = (t: TagValue) => t.id ?? `custom:${t.label.toLowerCase()}`;

// A typed entry that matches a listed option (ignoring case) becomes that option.
export function toTag(choice: ComboOption, options: readonly Option[]): TagValue {
  if (!isCustomOption(choice)) return { id: choice.value, label: choice.label };
  const hit = options.find((o) => o.label.toLowerCase() === choice.label.toLowerCase());
  return hit ? { id: hit.id, label: hit.label } : { label: choice.label };
}

export function TagPicker({ id, options, value, onChange, placeholder, labelledBy }: Props) {
  const comboOptions = useMemo<ComboOption[]>(() => options.map((o) => ({ value: o.id, label: o.label })), [options]);
  const selectedKeys = useMemo(() => new Set(value.map(keyOf)), [value]);

  const remove = (key: string) => onChange(value.filter((t) => keyOf(t) !== key));
  const toggle = (choice: ComboOption) => {
    const tag = toTag(choice, options);
    if (!selectedKeys.has(keyOf(tag))) onChange([...value, tag]);
    else if (!isCustomOption(choice)) remove(keyOf(tag));
  };

  return (
    <Combobox
      id={id}
      options={comboOptions}
      selected={null}
      selectedValues={selectedKeys}
      chips={value.map((t) => <SelectedChip key={keyOf(t)} label={t.label} onRemove={() => remove(keyOf(t))} />)}
      onSelect={(o) => (o ? toggle(o) : onChange(value.slice(0, -1)))}
      placeholder={placeholder}
      allowCustom
      labelledBy={labelledBy}
    />
  );
}
