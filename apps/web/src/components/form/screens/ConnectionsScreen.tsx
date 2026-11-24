import type { ReferenceData } from "@/lib/form/reference-types";
import { Card, CardTitle, FieldError, Label, inputClass } from "../fields";
import { RepeatableTagField } from "../RepeatableTagField";
import type { ScreenProps } from "./shared";

export function ConnectionsScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
  return (
    <Card>
      <CardTitle>Other Organizations / Community Groups</CardTitle>
      <div className="mt-4">
        <RepeatableTagField id="organizations" label="Organizations" options={reference.tags.organization}
          value={values.organizations} onChange={(v) => set("organizations", v)}
          placeholder="Search organizations or add your own" addLabel="+ Add Organization" />
      </div>
      <div className="mt-7">
        <Label htmlFor="anythingElse">Anything else you’d like to share?</Label>
        <p id="anythingElse-hint" className="-mt-1 mb-2 text-[13px] text-muted">
          We’d love to get to know you! Tell us what you’re passionate about, any ideas you have for YM, or how you’re involved in other organizations.
        </p>
        <textarea id="anythingElse" rows={4} maxLength={2000} value={values.anythingElse}
          onChange={(e) => set("anythingElse", e.target.value)}
          placeholder="Share as much or as little as you’d like"
          aria-describedby="anythingElse-hint"
          aria-invalid={err("anythingElse") ? true : undefined}
          className={`${inputClass} h-auto min-h-[115px] resize-y py-3`} />
        <FieldError id="anythingElse-error" message={err("anythingElse")} />
      </div>
    </Card>
  );
}
