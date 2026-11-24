import { useMemo, useState } from "react";
import { US_STATES } from "@/lib/form/options";
import type { ReferenceData } from "@/lib/form/reference-types";
import { Combobox, type ComboOption } from "../Combobox";
import { Card, FieldError, Label, TextField } from "../fields";
import { describe, locationOptions, type ScreenProps } from "./shared";

export function ContactScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
  const locOptions = useMemo(() => locationOptions(reference), [reference]);
  const selectedLoc = values.location ? locOptions.find((o) => o.value === `${values.location!.kind}:${values.location!.id}`) ?? null : null;

  // Shown when someone opens NeighborNet before choosing an SR / Region.
  const [needsLocation, setNeedsLocation] = useState(false);
  const locationError = err("location") ?? (needsLocation && !values.location ? "Please select your SR / Region first" : undefined);

  const parentId = values.location?.id;
  const nnOptions = useMemo<ComboOption[]>(
    () =>
      reference.neighborNets
        .filter((n) => n.parentId === parentId)
        .map((n) => ({ value: n.id, label: n.label, group: n.state ?? undefined })),
    [parentId, reference],
  );
  const selectedNn = nnOptions.find((o) => o.value === values.neighborNetId) ?? null;
  const stateOptions = useMemo(() => US_STATES.map((s) => ({ value: s, label: s })), []);

  return (
    <Card>
      <div className="grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
        <TextField id="email" label="Personal Email Address" required type="email" autoComplete="email"
          placeholder="name@example.com" value={values.email} onChange={(e) => set("email", e.target.value)}
          error={err("email")} />
        <TextField id="phone" label="Phone Number" required type="tel" autoComplete="tel" placeholder="(555) 555-0123"
          value={values.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} />
        <div>
          <Label id="state-label" htmlFor="state" required>State</Label>
          <Combobox id="state" labelledBy="state-label" options={stateOptions}
            selected={stateOptions.find((o) => o.value === values.state) ?? null}
            onSelect={(o) => set("state", o?.value ?? "")} placeholder="Select state"
            invalid={!!err("state")} describedBy={describe("state", err("state"))} />
          <FieldError id="state-error" message={err("state")} />
        </div>
        <div>
          <Label id="location-label" htmlFor="location" required>Subregion (SR) / Region (R)</Label>
          <Combobox id="location" labelledBy="location-label" options={locOptions} selected={selectedLoc}
            onSelect={(o) => {
              const [kind, id] = (o?.value ?? "").split(":");
              const location = o ? { kind: kind as "region" | "subregion", id } : null;
              set("location", location);
              set("neighborNetId", null);
            }}
            placeholder="Select SR / Region" invalid={!!locationError}
            describedBy={describe("location", locationError)} />
          <FieldError id="location-error" message={locationError} />
        </div>
        <div>
          <Label id="neighborNetId-label" htmlFor="neighborNetId">NeighborNet (NN)</Label>
          <Combobox id="neighborNetId" labelledBy="neighborNetId-label" options={nnOptions} selected={selectedNn}
            onSelect={(o) => set("neighborNetId", o?.value ?? null)} placeholder={values.location ? "Select NeighborNet" : "Select your SR / Region first"}
            onBlocked={
              values.location
                ? undefined
                : () => {
                    setNeedsLocation(true);
                    document.getElementById("location")?.focus();
                  }
            } />
        </div>
      </div>
    </Card>
  );
}
