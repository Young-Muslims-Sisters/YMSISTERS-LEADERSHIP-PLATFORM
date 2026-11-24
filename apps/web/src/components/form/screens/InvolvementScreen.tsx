import { CloudHelp } from "../CloudHelp";
import { Card, FieldError } from "../fields";
import { describe, type ScreenProps } from "./shared";

export function InvolvementScreen({ values, set, err, cycleYear }: ScreenProps & { cycleYear: number }) {
  const choices = [
    { value: "active_leadership" as const, title: "Active Leadership", body: `I am serving in a YM leadership position in ${cycleYear}.` },
    { value: "cloud" as const, title: "Interested in Cloud", body: `I previously served in YM leadership and would like to remain involved in ${cycleYear}.` },
  ];
  return (
    <Card>
      <fieldset aria-describedby={describe("involvement", err("involvement"))}>
        <legend className="mb-4 text-[18px] font-bold text-forest-950">How are you involved with YM in {cycleYear}?</legend>
        <div className="grid gap-3">
          {choices.map((c, i) => {
            const checked = values.involvement === c.value;
            const inputId = i === 0 ? "involvement" : `involvement-${c.value}`;
            return (
              <div
                key={c.value}
                className={`relative flex gap-3.5 rounded-xl border-2 p-4 transition-colors ${
                  checked ? "border-forest-600 bg-mint-25" : "border-line bg-white hover:border-sage-300"
                }`}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="involvement"
                  value={c.value}
                  checked={checked}
                  aria-describedby={`${inputId}-body`}
                  onChange={() => set("involvement", c.value)}
                  className="mt-0.5 size-5 shrink-0 accent-forest-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    {/* The label stretches over the card, so the whole card is clickable. */}
                    <label htmlFor={inputId} className="cursor-pointer text-[16px] font-bold text-forest-950 after:absolute after:inset-0">
                      {c.title}
                    </label>
                    {c.value === "cloud" && <CloudHelp />}
                  </div>
                  <p id={`${inputId}-body`} className="mt-0.5 text-[13px] text-muted">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
        <FieldError id="involvement-error" message={err("involvement")} />
      </fieldset>
    </Card>
  );
}
