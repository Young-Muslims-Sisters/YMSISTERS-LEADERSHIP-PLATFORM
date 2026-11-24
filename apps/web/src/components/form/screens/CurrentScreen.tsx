import type { ReferenceData } from "@/lib/form/reference-types";
import { AddButton, Card, CardTitle, FieldError, TextButton } from "../fields";
import { PositionSelect } from "../PositionSelect";
import { fieldId, type ScreenProps } from "./shared";

export function CurrentScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
  const list = values.currentPositions;
  const update = (i: number, position: string | null) => set("currentPositions", list.map((p, j) => (j === i ? { position } : p)));
  return (
    <Card>
      <CardTitle>Current YM Leadership Position(s)</CardTitle>
      <FieldError id="currentPositions-error" message={err("currentPositions")} />
      <div className="mt-4 grid gap-6">
        {list.map((p, i) => (
          <div key={i}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[12px] font-semibold text-forest-600">Position {i + 1}</p>
              {list.length > 1 && (
                <TextButton onClick={() => set("currentPositions", list.filter((_, j) => j !== i))}>Remove</TextButton>
              )}
            </div>
            <PositionSelect id={fieldId(`currentPositions.${i}.position`)} label="Position / Team" required
              value={p.position} onChange={(v) => update(i, v)} reference={reference}
              error={err(`currentPositions.${i}.position`)} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <AddButton onClick={() => set("currentPositions", [...list, { position: null }])} disabled={list.length >= 10}>
          {"+ Add Another Position"}
        </AddButton>
      </div>
    </Card>
  );
}
