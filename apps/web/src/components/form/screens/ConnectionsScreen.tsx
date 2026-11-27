import type { ReferenceData } from "@/lib/form/reference-types";
import { Card, CardTitle, FieldError, Label, inputClass } from "../fields";
import { OrganizationsField } from "../OrganizationsField";
import type { ScreenProps } from "./shared";

export function ConnectionsScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
  return (
    <Card>
      <CardTitle>Other Organizations / Community Groups</CardTitle>
      <p className="mt-1 text-[13px] text-muted">Add any you’ve been part of, with your role and what you worked on.</p>
      <div className="mt-4">
        <OrganizationsField options={reference.tags.organization} value={values.organizations}
          onChange={(v) => set("organizations", v)} />
      </div>
      <div className="mt-7">
        <Label htmlFor="anythingElse">Anything else you’d like to share?</Label>
        <p id="anythingElse-hint" className="-mt-1 mb-2 text-[13px] text-muted">
          Your passions, ideas for YM, or anything else on your mind.
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
