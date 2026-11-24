"use client";

import { useMemo, useState } from "react";
import type { Option } from "@/lib/form/reference-types";
import type { TagValue } from "@/lib/form/schema";
import { Combobox } from "./Combobox";
import { AddButton, Label, TextButton } from "./fields";
import { toTag } from "./TagPicker";

export function RepeatableTagField({ id, label, options, value, onChange, placeholder, addLabel }: {
  id: string; label: string; options: Option[]; value: TagValue[]; onChange: (v: TagValue[]) => void;
  placeholder: string; addLabel: string;
}) {
  const [extraRows, setExtraRows] = useState(0);
  const rows = Math.max(1, value.length + extraRows);
  const comboOptions = useMemo(() => options.map((o) => ({ value: o.id, label: o.label })), [options]);
  return (
    <div>
      <Label id={`${id}-label`} htmlFor={`${id}-0`}>{label}</Label>
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, i) => {
          const current = value[i];
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <Combobox id={`${id}-${i}`} labelledBy={`${id}-label`} options={comboOptions} allowCustom
                  selected={current ? { value: current.id ?? `custom:${current.label}`, label: current.label } : null}
                  onSelect={(o) => {
                    if (!o) {
                      onChange(value.filter((_, j) => j !== i));
                      return;
                    }
                    const nextValue = [...value];
                    if (i < value.length) nextValue[i] = toTag(o, options);
                    else {
                      nextValue.push(toTag(o, options));
                      setExtraRows((n) => Math.max(0, n - 1));
                    }
                    onChange(nextValue);
                  }}
                  placeholder={placeholder} />
              </div>
              {rows > 1 && (
                <TextButton
                  aria-label={`Remove ${current?.label ?? "empty entry"}`}
                  onClick={() => (i < value.length ? onChange(value.filter((_, j) => j !== i)) : setExtraRows((n) => n - 1))}
                >
                  Remove
                </TextButton>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-[14px]">
        <AddButton onClick={() => setExtraRows((n) => n + 1)} disabled={rows > value.length}>{addLabel}</AddButton>
      </div>
    </div>
  );
}
