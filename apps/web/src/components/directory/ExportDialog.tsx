"use client";

import { useState, useTransition } from "react";
import { exportCsv } from "@/app/directory/actions";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { Dialog } from "@/components/ui/Dialog";

export function ExportDialog({ resultIds, onClose }: { resultIds: string[]; onClose: () => void }) {
  const [scope, setScope] = useState<"results" | "all">("results");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const download = () =>
    startTransition(async () => {
      setFailed(false);
      try {
        const csv = await exportCsv(scope === "all" ? null : resultIds);
        // The byte-order mark makes Excel read accents and Arabic correctly.
        const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "ym-leadership-contacts.csv";
        link.click();
        URL.revokeObjectURL(url);
        onClose();
      } catch {
        setFailed(true);
      }
    });

  return (
    <Dialog title="Export leadership contacts" variant="modal" onClose={onClose}>
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-[13px] text-muted">Choose what to include in your export.</legend>
        {([["results", "Current search and filtered results"], ["all", "All contacts I can view"]] as const).map(([value, label]) => (
          <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-[14px] ${scope === value ? "border-forest-600 bg-mint-50" : "border-line"}`}>
            <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} className="size-4 accent-forest-600" />
            {label}
          </label>
        ))}
      </fieldset>
      {failed && <p role="alert" className="mt-3 text-[13px] text-danger">The export didn’t work. Please try again.</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
        <button type="button" onClick={download} disabled={pending} className={primaryButton}>{pending ? "Exporting…" : "Export CSV"}</button>
      </div>
    </Dialog>
  );
}
