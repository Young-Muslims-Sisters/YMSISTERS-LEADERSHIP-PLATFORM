"use server";

import { annualFormSchema, fieldErrors, type AnnualFormValues } from "@/lib/form/schema";
import { env } from "@/lib/server/env";
import { checkIdentity } from "@/lib/server/identity";
import { submitAnnualForm } from "@/lib/server/submission";

// Anyone can call this, so every input is re-validated here.

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";

const MISMATCH_ERROR =
  "This email is already on file with a different date of birth. Check both, or contact YM IT if you need help.";

// Validates the form, then saves the submission in one database transaction.
export async function submitForm(values: AnnualFormValues): Promise<ActionResult> {
  const parsed = annualFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Some answers need attention.", fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    const identity = await checkIdentity(parsed.data.email, parsed.data.birthday);
    if (identity === "mismatch") return { ok: false, error: MISMATCH_ERROR };
    if (identity === "too_many_attempts") {
      return { ok: false, error: "Too many attempts for this email. Please try again in an hour." };
    }
    await submitAnnualForm(parsed.data, env.cycleYear);
    return { ok: true };
  } catch (err) {
    console.error("[form] submitForm failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
