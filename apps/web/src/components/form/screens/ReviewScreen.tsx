import { useMemo, useState, useTransition } from "react";
import { submitForm } from "@/app/actions";
import type { ReferenceData } from "@/lib/form/reference-types";
import type { AnnualFormValues, TagValue } from "@/lib/form/schema";
import type { ComboOption } from "../Combobox";
import { Card, TextButton } from "../fields";
import { FormFooter, PrimaryButton } from "../FormFooter";
import { positionDetail } from "../PositionFields";
import { locationOptions, positionOptions, type Screen } from "./shared";

export function ReviewScreen({ values, reference, onEdit, onBack, onServerErrors, onDone }: {
  values: AnnualFormValues; reference: ReferenceData; onEdit: (s: Screen) => void; onBack: () => void;
  onServerErrors: (errs: Record<string, string>) => void; onDone: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const positions = useMemo(() => positionOptions(reference), [reference]);
  const loc = useMemo(() => locationOptions(reference), [reference]);
  const label = (opts: ComboOption[], v: string | null | undefined) => opts.find((o) => o.value === v)?.label;
  const join = (parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join("  ·  ") || "Not provided";
  const list = (tags: TagValue[]) => tags.map((t) => t.label).join(", ");

  const isCloud = values.involvement === "cloud";
  const named = (p: (typeof values.currentPositions)[number]) => {
    const name = label(positions, p.position);
    const detail = positionDetail(p);
    return name && detail ? `${name} · ${detail}` : name;
  };
  const current = isCloud ? [] : values.currentPositions.map(named).filter(Boolean);
  const nn = reference.neighborNets.find((n) => n.id === values.neighborNetId)?.label;
  const birthday = values.birthday ? new Date(`${values.birthday}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

  const previous = values.previousPositions.flatMap((p) => {
    const name = named(p);
    const years = [p.fromYear, p.toYear].filter(Boolean).join("–");
    return name ? [years ? `${name}, ${years}` : name] : [];
  });

  const rows: { title: string; summary: string; screen: Screen }[] = [
    {
      title: "Personal Information",
      summary: join([`${values.firstName} ${values.lastName}`.trim(), birthday, list(values.ethnicity)]),
      screen: "personal",
    },
    {
      title: "Contact Details",
      summary: join([values.email, values.phone, values.ymEmail || (values.ymEmailStatus === "needs" ? "Needs a YM email" : "")]),
      screen: "contact",
    },
    {
      title: "Your Location",
      summary: join([values.state, values.location && label(loc, `${values.location.kind}:${values.location.id}`), nn,
        [values.addressLine1, values.city].filter(Boolean).join(", ")]),
      screen: "location",
    },
    { title: "YM Involvement", summary: isCloud ? "Interested in Cloud" : "Active Leadership", screen: "involvement" },
    ...(isCloud ? [] : [{ title: "Current Leadership", summary: join(current), screen: "current" as const }]),
    {
      title: "Leadership History",
      summary: values.noPreviousPositions ? "No previous positions" : join(previous),
      screen: "previous",
    },
    { title: "Skills & Contributions", summary: join([list(values.skills), list(values.interests)]), screen: "skills" },
    {
      title: "Education & Background",
      summary: join([values.educationStatus.join(", "), list(values.schools), list(values.fieldsOfStudy), values.occupation?.label]),
      screen: "education",
    },
    {
      title: "Background & Connections",
      summary: join([values.organizations.map((o) => (o.role ? `${o.org.label} (${o.role})` : o.org.label)).join(", "), values.anythingElse]),
      screen: "connections",
    },
  ];

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await submitForm(values);
      if (res.ok) return onDone();
      if (res.fieldErrors && Object.keys(res.fieldErrors).length) return onServerErrors(res.fieldErrors);
      setMessage(res.error);
    });
  };

  return (
    <>
      <Card>
        <h2 className="text-[18px] font-semibold text-forest-950">Please review your information</h2>
        <ul className="mt-[20px] grid grid-cols-[minmax(0,1fr)] gap-[7px]">
          {rows.map((r) => (
            <li key={r.title} className="flex items-center gap-4 rounded-[10px] border-[1.6px] border-sage-300 bg-white px-[14.4px] py-[8.4px]">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">{r.title}</p>
                <p className="mt-[9px] mb-[5px] truncate text-[12px] text-muted">{r.summary}</p>
              </div>
              <TextButton onClick={() => onEdit(r.screen)} aria-label={`Edit ${r.title}`} disabled={pending}>Edit</TextButton>
            </li>
          ))}
        </ul>

        <div aria-live="polite" className="mt-4 empty:hidden">
          {message && <p className="text-[13px] font-medium text-danger">{message}</p>}
        </div>
      </Card>

      <FormFooter onBack={pending ? undefined : onBack}>
        <PrimaryButton onClick={submit} disabled={pending}>{pending ? "Submitting…" : "Submit Form"}</PrimaryButton>
      </FormFooter>
    </>
  );
}

