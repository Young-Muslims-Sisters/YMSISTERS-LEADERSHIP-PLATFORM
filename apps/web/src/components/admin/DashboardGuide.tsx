"use client";

import { useState, useSyncExternalStore } from "react";
import { primaryButton } from "@/components/ui/buttons";
import { Dialog } from "@/components/ui/Dialog";

const SEEN_KEY = "ym-it-dashboard-guide-seen";
const subscribe = () => () => {};

const GUIDE = [
  ["See who has submitted", "Every accepted form is listed, newest first. Submitting also updates the directory right away, so there is nothing to approve."],
  ["Find a response", "Search by name, email, role or region. Use Filter and Sort to narrow the list."],
  ["Open the full answers", "Select a name to see everything they submitted, including private answers like date of birth and ethnicity. Please keep these confidential."],
  ["Check SRC emails", "Queued is waiting to send, Sent was delivered to the email service, and Failed needs attention. No route means there is no SRC email for that subregion or region."],
  ["Spot possible duplicates", "A yellow label means someone with the same name already has a profile under another email. Profiles are never merged automatically."],
] as const;

// "?" button explaining the dashboard. Opens by itself the first time on each browser.
export function DashboardGuide() {
  const seen = useSyncExternalStore(subscribe, () => localStorage.getItem(SEEN_KEY) !== null, () => true);
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? !seen;

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setChoice(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="What can I do here?"
        onClick={() => setChoice(true)}
        className="grid size-7 place-items-center rounded-full bg-mint-100 text-[14px] font-semibold text-forest-600 transition-colors hover:bg-forest-600 hover:text-white"
      >
        ?
      </button>
      {open && (
        <Dialog title="What you can do here" variant="modal" onClose={close}>
          <ul className="grid gap-4">
            {GUIDE.map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-sand text-[13px] font-bold text-forest-950">{i + 1}</span>
                <div>
                  <p className="text-[14px] font-semibold text-forest-950">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] text-muted">Correcting answers and resending emails aren’t available here yet.</p>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={close} className={primaryButton}>Got it</button>
          </div>
        </Dialog>
      )}
    </>
  );
}
