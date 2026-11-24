import { useMemo } from "react";
import type { ReferenceData } from "@/lib/form/reference-types";
import { Combobox } from "./Combobox";
import { FieldError, Label } from "./fields";
import { describe, positionOptions } from "./screens/shared";

export function PositionSelect({ id, value, onChange, reference, label, required, error }: {
  id: string; value: string | null; onChange: (v: string | null) => void; reference: ReferenceData;
  label: string; required?: boolean; error?: string;
}) {
  const options = useMemo(() => positionOptions(reference), [reference]);
  return (
    <div>
      <Label id={`${id}-label`} htmlFor={id} required={required}>{label}</Label>
      <Combobox id={id} labelledBy={`${id}-label`} options={options}
        selected={options.find((o) => o.value === value) ?? null} onSelect={(o) => onChange(o?.value ?? null)}
        placeholder="Select a position or national team" invalid={!!error} describedBy={describe(id, error)} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
