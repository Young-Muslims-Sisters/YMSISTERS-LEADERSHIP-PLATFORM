import type { ReferenceData } from "@/lib/form/reference-types";
import { EMPTY_POSITION } from "@/lib/form/schema";
import { AddButton, Card, CardTitle, FieldError, TextButton } from "../fields";
import { PositionFields, type PositionValue } from "../PositionFields";
import { fieldId, type ScreenProps } from "./shared";

export function CurrentScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
  const list = values.currentPositions;
  const update = (i: number, patch: Partial<PositionValue>) =>
    set("currentPositions", list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <Card>
      <CardTitle>Current YM Leadership Position(s)</CardTitle>
      <FieldError id="currentPositions-error" message={err("currentPositions")} />
      <div className="mt-4 grid gap-4">
        {list.map((p, i) => (
          <div key={i} className="rounded-[12px] border-[1.5px] border-sage-200 bg-white p-[15.5px]">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-forest-600">Position {i + 1}</p>
              {list.length > 1 && (
                <TextButton onClick={() => set("currentPositions", list.filter((_, j) => j !== i))}>Remove</TextButton>
              )}
            </div>
            <PositionFields id={fieldId(`currentPositions.${i}`)} label="Position / Team" required value={p}
              onChange={(patch) => update(i, patch)} reference={reference}
              err={(field) => err(`currentPositions.${i}.${field}`)} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <AddButton onClick={() => set("currentPositions", [...list, EMPTY_POSITION])} disabled={list.length >= 10}>
          {"+ Add Another Position"}
        </AddButton>
      </div>
    </Card>
  );
}
