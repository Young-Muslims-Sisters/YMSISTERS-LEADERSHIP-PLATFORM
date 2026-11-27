import { YM_EMAIL_DOMAIN } from "@/lib/form/schema";
import { Card, FieldError, TextField } from "../fields";
import { describe, type ScreenProps } from "./shared";

const YM_CHOICES = [
  { value: "has" as const, label: "Yes, I have one" },
  { value: "needs" as const, label: "No, I need one" },
];

export function ContactScreen({ values, set, err }: ScreenProps) {
  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
          <TextField id="email" label="Personal Email Address" required type="email" autoComplete="email"
            placeholder="name@example.com" value={values.email} onChange={(e) => set("email", e.target.value)}
            error={err("email")} />
          <TextField id="phone" label="Phone Number" required type="tel" autoComplete="tel" placeholder="(555) 555-0123"
            value={values.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} />
        </div>
      </Card>

      <Card>
        <fieldset aria-describedby={describe("ymEmailStatus", err("ymEmailStatus"))}>
          <legend className="text-[16px] font-bold text-forest-950">
            Do you have a YM email (@{YM_EMAIL_DOMAIN})? <span aria-hidden className="text-danger">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {YM_CHOICES.map((c, i) => (
              <label key={c.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] px-3 py-2.5 text-[14px] ${
                values.ymEmailStatus === c.value ? "border-forest-600 bg-mint-25 font-semibold text-forest-950" : "border-sage-300 bg-white text-ink"
              }`}>
                <input id={i === 0 ? "ymEmailStatus" : undefined} type="radio" name="ymEmailStatus" value={c.value}
                  checked={values.ymEmailStatus === c.value} className="size-4 accent-forest-600"
                  onChange={() => {
                    set("ymEmailStatus", c.value);
                    if (c.value !== "has") set("ymEmail", "");
                  }} />
                {c.label}
              </label>
            ))}
          </div>
          <FieldError id="ymEmailStatus-error" message={err("ymEmailStatus")} />
        </fieldset>
        {values.ymEmailStatus === "has" && (
          <div className="mt-4 sm:max-w-[420px]">
            <TextField id="ymEmail" label="YM Email Address" required type="email" autoComplete="off"
              placeholder={`name@${YM_EMAIL_DOMAIN}`} value={values.ymEmail} onChange={(e) => set("ymEmail", e.target.value)}
              error={err("ymEmail")} />
          </div>
        )}
        {values.ymEmailStatus === "needs" && (
          <p role="status" className="mt-4 rounded-lg bg-sand/60 px-4 py-3 text-[13px] text-forest-950">
            You need one to view the Leadership Directory. We’ll let IT know to set one up for you.
          </p>
        )}
      </Card>
    </div>
  );
}
