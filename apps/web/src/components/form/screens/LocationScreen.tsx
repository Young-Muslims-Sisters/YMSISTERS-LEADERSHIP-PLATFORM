import { useMemo, useState } from "react";
import { US_STATES } from "@/lib/form/options";
import type { ReferenceData } from "@/lib/form/reference-types";
import { Combobox, type ComboOption } from "../Combobox";
import { Card, CardTitle, FieldError, Label, TextField } from "../fields";
import { describe, locationOptions, type ScreenProps } from "./shared";

export function LocationScreen({ values, set, err, reference }: ScreenProps & { reference: ReferenceData }) {
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
        .map((n) => ({ value: n.id, label: n.label, group: n.state ?? undefined }))
        // NeighborNets in the person's own state come first.
        .sort((a, b) => Number(b.group === values.state) - Number(a.group === values.state)),
    [parentId, reference, values.state],
  );
  const selectedNn = nnOptions.find((o) => o.value === values.neighborNetId) ?? null;
  const stateOptions = useMemo(() => US_STATES.map((s) => ({ value: s, label: s })), []);

  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
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
                set("location", o ? { kind: kind as "region" | "subregion", id } : null);
                set("neighborNetId", null);
              }}
              placeholder="Select SR / Region" invalid={!!locationError}
              describedBy={describe("location", locationError)} />
            <p className="mt-1.5 text-[12px] text-muted">Not in a subregion? Choose your region, or Expansion if you’re not sure.</p>
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

      <Card>
        <CardTitle>Mailing Address</CardTitle>
        <p className="mt-1 text-[13px] text-muted">For special deliveries.</p>
        <div className="mt-4 grid gap-x-[49px] gap-y-6 sm:grid-cols-2">
          <TextField id="addressLine1" label="Street Address" autoComplete="address-line1" placeholder="123 Main St"
            value={values.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} error={err("addressLine1")} />
          <TextField id="addressLine2" label="Apt, Suite, etc." autoComplete="address-line2" placeholder="Apt 4B"
            value={values.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} error={err("addressLine2")} />
          <TextField id="city" label="City" autoComplete="address-level2" placeholder="City"
            value={values.city} onChange={(e) => set("city", e.target.value)} error={err("city")} />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
            <div className="min-w-0">
              <Label id="addressState-label" htmlFor="addressState">State</Label>
              <Combobox id="addressState" labelledBy="addressState-label" options={stateOptions}
                selected={stateOptions.find((o) => o.value === values.addressState) ?? null}
                onSelect={(o) => set("addressState", o?.value ?? "")} placeholder="State" />
            </div>
            <TextField id="postalCode" label="ZIP Code" autoComplete="postal-code" inputMode="numeric" placeholder="12345"
              value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} error={err("postalCode")} />
          </div>
        </div>
      </Card>
    </div>
  );
}
