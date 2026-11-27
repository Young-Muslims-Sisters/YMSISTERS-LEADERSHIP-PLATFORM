import { useMemo } from "react";
import type { ReferenceData } from "@/lib/form/reference-types";
import { TEAM_TITLES, type TagValue, type TeamTitle } from "@/lib/form/schema";
import { Combobox } from "./Combobox";
import { FieldError, Label, TextField } from "./fields";
import { PositionSelect } from "./PositionSelect";
import { describe } from "./screens/shared";
import { toTag } from "./TagPicker";

export type PositionValue = { position: string | null; portfolio: TagValue | null; teamTitle: TeamTitle | null; titleDetail: string };

const TITLE_OPTIONS = Object.entries(TEAM_TITLES).map(([value, label]) => ({ value, label }));

// Roles whose holders pick a portfolio (shura roles).
export function portfolioRoles(reference: ReferenceData): Set<string> {
  return new Set(reference.roleTypes.filter((r) => r.hasPortfolio).map((r) => `role:${r.id}`));
}

type Props = {
  id: string;
  label: string;
  value: PositionValue;
  onChange: (patch: Partial<PositionValue>) => void;
  reference: ReferenceData;
  required?: boolean;
  err: (field: keyof PositionValue) => string | undefined;
};

// A position, then what the person does in it: a shura portfolio, or their position on a team.
export function PositionFields({ id, label, value, onChange, reference, required, err }: Props) {
  const needsPortfolio = useMemo(() => portfolioRoles(reference), [reference]).has(value.position ?? "");
  const isTeam = value.position?.startsWith("team:") ?? false;
  const departments = useMemo(() => reference.teams.map((t) => ({ value: t.id, label: t.label })), [reference]);
  const detailLabel = value.teamTitle === "lead" ? "What do you lead?" : "Your title";

  return (
    <div className="grid gap-4">
      <PositionSelect id={`${id}-position`} label={label} required={required} value={value.position} reference={reference}
        error={err("position")}
        onChange={(position) => onChange({ position, portfolio: null, teamTitle: null, titleDetail: "" })} />

      {needsPortfolio && (
        <div>
          <Label id={`${id}-portfolio-label`} htmlFor={`${id}-portfolio`} required={required}>Portfolio</Label>
          <Combobox id={`${id}-portfolio`} labelledBy={`${id}-portfolio-label`} options={departments} allowCustom
            selected={value.portfolio ? { value: value.portfolio.id ?? `custom:${value.portfolio.label}`, label: value.portfolio.label } : null}
            onSelect={(o) => onChange({ portfolio: o ? toTag(o, reference.teams) : null })}
            placeholder="e.g. Tarbiyyah, Expansion, Finance" invalid={!!err("portfolio")}
            describedBy={describe(`${id}-portfolio`, err("portfolio"))} />
          <FieldError id={`${id}-portfolio-error`} message={err("portfolio")} />
        </div>
      )}

      {isTeam && (
        <div>
          <Label id={`${id}-teamTitle-label`} htmlFor={`${id}-teamTitle`} required={required}>Your position on the team</Label>
          <Combobox id={`${id}-teamTitle`} labelledBy={`${id}-teamTitle-label`} options={TITLE_OPTIONS}
            selected={TITLE_OPTIONS.find((o) => o.value === value.teamTitle) ?? null}
            onSelect={(o) => onChange({ teamTitle: (o?.value as TeamTitle | undefined) ?? null, titleDetail: "" })}
            placeholder="Chair, Co-Chair, Lead or Member" invalid={!!err("teamTitle")}
            describedBy={describe(`${id}-teamTitle`, err("teamTitle"))} />
          <FieldError id={`${id}-teamTitle-error`} message={err("teamTitle")} />
        </div>
      )}

      {isTeam && (value.teamTitle === "lead" || value.teamTitle === "other") && (
        <TextField id={`${id}-titleDetail`} label={detailLabel} required maxLength={100}
          placeholder={value.teamTitle === "lead" ? "e.g. Logistics" : "e.g. Secretary"}
          value={value.titleDetail} onChange={(e) => onChange({ titleDetail: e.target.value })} error={err("titleDetail")} />
      )}
    </div>
  );
}

// "SubRegional Shura · Tarbiyyah", "Conferences (YMC) · Logistics Lead". Used on the review screen.
export function positionDetail(p: PositionValue): string | null {
  if (p.portfolio) return p.portfolio.label;
  if (!p.teamTitle) return null;
  if (p.teamTitle === "lead") return p.titleDetail ? `${p.titleDetail} Lead` : "Lead";
  if (p.teamTitle === "other") return p.titleDetail || null;
  return TEAM_TITLES[p.teamTitle];
}
