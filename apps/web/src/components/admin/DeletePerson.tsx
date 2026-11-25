"use client";

import { useState, useTransition } from "react";
import { deletePerson } from "@/app/admin/actions";
import { secondaryButton } from "@/components/ui/buttons";

type Props = { userId: string; name: string; onDeleted: () => void };

// Asks once more before deleting, because it cannot be undone.
export function DeletePerson({ userId, name, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="mt-6 px-1 py-2 text-[13px] font-semibold text-danger hover:underline">
        Delete this person
      </button>
    );
  }

  const confirm = () =>
    startTransition(async () => {
      setFailed(false);
      const result = await deletePerson(userId).catch(() => ({ ok: false }));
      if (result.ok) onDeleted();
      else setFailed(true);
    });

  return (
    <section aria-label="Confirm delete" className="mt-6 rounded-xl border border-danger p-4">
      <p className="text-[14px] font-semibold text-forest-950">Delete {name}?</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink">
        This permanently removes their directory profile and all their responses from every year. It can’t be undone.
      </p>
      {failed && <p role="alert" className="mt-2 text-[13px] font-medium text-danger">That didn’t work. Please try again.</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" autoFocus disabled={pending} onClick={() => setConfirming(false)} className={secondaryButton}>Cancel</button>
        <button
          type="button"
          disabled={pending}
          onClick={confirm}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-danger px-6 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete permanently"}
        </button>
      </div>
    </section>
  );
}
