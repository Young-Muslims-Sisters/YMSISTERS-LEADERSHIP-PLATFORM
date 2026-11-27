import type { ReferenceData } from "@/lib/form/reference-types";
import { EMPTY_POSITION } from "@/lib/form/schema";
import { AddButton, Card, CardTitle, Label, TextButton, inputClass } from "../fields";
import { PositionFields } from "../PositionFields";
import { YearPicker } from "../YearPicker";
import { fieldId, type ScreenProps } from "./shared";

const EMPTY = { ...EMPTY_POSITION, description: "", fromYear: "", toYear: "" };

export function PreviousScreen({ values, set, err, reference, cycleYear }: ScreenProps & { reference: ReferenceData; cycleYear: number }) {
  const list = values.previousPositions;
  const update = (i: number, patch: Partial<(typeof list)[number]>) =>
    set("previousPositions", list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const none = values.noPreviousPositions;
  // Ticking the box clears the list, so hidden entries are never submitted.
  const setNone = (checked: boolean) => {
    set("noPreviousPositions", checked);
    if (checked) set("previousPositions", [EMPTY]);
  };
  return (
    <Card>
      <CardTitle>Previous YM Leadership Positions</CardTitle>
      {!none && (
        <div className="mt-4 grid gap-4">
          {list.map((p, i) => (
            <div key={i} className="rounded-[12px] border-[1.5px] border-sage-200 bg-white p-[15.5px]">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-forest-600">Position {i + 1}</p>
                {list.length > 1 && (
                  <TextButton onClick={() => set("previousPositions", list.filter((_, j) => j !== i))}>Remove</TextButton>
                )}
              </div>
              <PositionFields id={fieldId(`previousPositions.${i}`)} label="Position" value={p}
                onChange={(patch) => update(i, patch)} reference={reference}
                err={(field) => err(`previousPositions.${i}.${field}`)} />
              <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2">
                <YearPicker id={fieldId(`previousPositions.${i}.fromYear`)} label="From Year" value={p.fromYear}
                  onChange={(v) => update(i, { fromYear: v })} maxYear={cycleYear}
                  error={err(`previousPositions.${i}.fromYear`)} />
                <YearPicker id={fieldId(`previousPositions.${i}.toYear`)} label="To Year" value={p.toYear}
                  onChange={(v) => update(i, { toYear: v })} maxYear={cycleYear}
                  minYear={p.fromYear ? Number(p.fromYear) : undefined}
                  error={err(`previousPositions.${i}.toYear`)} />
              </div>
              <div className="mt-4">
                <Label htmlFor={fieldId(`previousPositions.${i}.description`)}>What did you do in this role?</Label>
                <textarea id={fieldId(`previousPositions.${i}.description`)} rows={3} maxLength={1000} value={p.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  placeholder="Projects, events or anything you’re proud of"
                  className={`${inputClass} h-auto min-h-[90px] resize-y py-3`} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-[15px] flex flex-wrap items-center gap-x-[22px] gap-y-4">
        {!none && (
          <AddButton onClick={() => set("previousPositions", [...list, EMPTY])} disabled={list.length >= 20}>
            {"+ Add Previous Position"}
          </AddButton>
        )}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink">
          <input type="checkbox" checked={none} onChange={(e) => setNone(e.target.checked)}
            className="size-[18px] accent-forest-600" />
          I have not previously held a YM leadership position.
        </label>
      </div>
    </Card>
  );
}
