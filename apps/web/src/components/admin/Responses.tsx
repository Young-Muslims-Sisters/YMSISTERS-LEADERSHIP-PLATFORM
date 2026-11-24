"use client";

import { useMemo, useState } from "react";
import type { ComboOption } from "@/components/form/Combobox";
import { FilterIcon } from "@/components/form/icons";
import { years } from "@/components/directory/ProfileDrawer";
import { PageTitle } from "@/components/ui/AppShell";
import { Dialog } from "@/components/ui/Dialog";
import { Badge, Facts, SearchBox, Section, Toolbar, ToolbarButton, type Tone } from "@/components/ui/display";
import { FilterDialog } from "@/components/ui/FilterDialog";
import { Pagination, usePaged } from "@/components/ui/Pagination";
import { SortMenu } from "@/components/ui/SortMenu";
import type { EmailStatus, Response } from "@/lib/admin/types";
import { DashboardGuide } from "./DashboardGuide";

const EMAIL: Record<EmailStatus, { label: string; tone: Tone }> = {
  queued: { label: "Queued", tone: "yellow" },
  sending: { label: "Sending", tone: "yellow" },
  sent: { label: "Sent", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  no_route: { label: "No route", tone: "red" },
};

const FIELDS = [
  { key: "email", label: "SRC email" },
  { key: "location", label: "SR / Region" },
  { key: "involvement", label: "Involvement" },
] as const;
type Key = (typeof FIELDS)[number]["key"];
const NO_FILTERS: Record<Key, string[]> = { email: [], location: [], involvement: [] };

const SORTS = { newest: "Newest first", oldest: "Oldest first", name: "Name (A to Z)" } as const;

const value = (r: Response, key: Key) =>
  key === "email" ? EMAIL[r.emailStatus].label : key === "location" ? (r.location ?? "None") : r.involvement;
const roleNames = (r: Response) => r.current.map((c) => c.short).join(", ") || r.involvement;
const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

type Props = { responses: Response[]; profileCount: number; cycleYear: number };

export function Responses({ responses, profileCount, cycleYear }: Props) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [filtering, setFiltering] = useState(false);
  const [sort, setSort] = useState<keyof typeof SORTS>("newest");
  const [open, setOpen] = useState<Response | null>(null);

  const options = useMemo(
    () => Object.fromEntries(FIELDS.map(({ key }) => [key, [...new Set(responses.map((r) => value(r, key)))].sort().map((v) => ({ value: v, label: v }))])) as Record<Key, ComboOption[]>,
    [responses],
  );
  const results = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    const found = responses.filter((r) => {
      const text = [r.name, r.email, r.location, r.neighborNet, ...r.current.flatMap((c) => [c.short, c.name])].join(" ").toLowerCase();
      return (
        words.every((w) => text.includes(w)) &&
        FIELDS.every(({ key }) => filters[key].length === 0 || filters[key].includes(value(r, key)))
      );
    });
    if (sort === "name") return found.sort((a, b) => a.name.localeCompare(b.name));
    return sort === "oldest" ? found.reverse() : found;
  }, [responses, search, filters, sort]);

  const { visible, pagination } = usePaged(results, JSON.stringify([search, filters, sort]));
  const submitted = new Set(responses.map((r) => r.userId)).size;
  const issues = responses.filter((r) => r.emailStatus === "failed" || r.emailStatus === "no_route").length;
  const filterCount = FIELDS.filter(({ key }) => filters[key].length > 0).length;

  return (
    <>
      <PageTitle aside={<DashboardGuide />} subtitle={`Manage ${cycleYear} leadership submissions and SRC notifications.`}>IT Dashboard</PageTitle>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {([["Leadership profiles", profileCount], [`${cycleYear} forms submitted`, `${submitted} / ${profileCount}`], ["Notification issues", issues]] as const).map(([label, n]) => (
          <div key={label} className="rounded-xl border border-sage-300 bg-white p-4">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="mt-1 text-[24px] font-bold text-forest-950">{n}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-8 font-display text-[18px] text-forest-950 uppercase sm:text-[22px]">{cycleYear} Responses</h2>
      <p className="text-[13px] text-muted">Accepted submissions update the directory automatically. SRCs receive an informational email.</p>
      <div className="mt-4 mb-4 flex flex-col gap-3 md:flex-row">
        <SearchBox aria-label="Search responses" placeholder="Search names, roles, regions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Toolbar>
          <ToolbarButton icon={<FilterIcon />} count={filterCount} onClick={() => setFiltering(true)}>Filter</ToolbarButton>
          <SortMenu options={SORTS} value={sort} onChange={setSort} />
        </Toolbar>
      </div>

      <div className="overflow-x-auto rounded-xl border border-sage-300 bg-white">
        <table className="w-full min-w-[680px] text-left text-[13px]">
          <thead className="bg-mint-50 text-forest-950">
            <tr>{["Name", "Leadership role", "SR / Region", "Submitted", "SRC email"].map((h) => <th key={h} scope="col" className="px-4 py-4">{h}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="relative border-t border-line hover:bg-mint-25">
                <td className="px-4 py-3.5">
                  <button type="button" onClick={() => setOpen(r)} className="text-left font-semibold text-forest-950 after:absolute after:inset-0">{r.name}</button>
                  {r.possibleDuplicate && <span className="ml-2"><Badge tone="yellow">Possible duplicate</Badge></span>}
                </td>
                <td className="px-4 py-3.5">{roleNames(r)}</td>
                <td className="px-4 py-3.5">{r.location ?? "—"}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">{date(r.submittedAt)}</td>
                <td className="px-4 py-3.5"><Badge tone={EMAIL[r.emailStatus].tone}>{EMAIL[r.emailStatus].label}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && <p className="p-8 text-center text-[14px] text-muted">No responses match.</p>}
      </div>
      <Pagination {...pagination} />

      {filtering && (
        <FilterDialog title="Filter responses" fields={FIELDS} options={() => options} value={filters} onClose={() => setFiltering(false)}
          onApply={(v) => {
            setFilters(v);
            setFiltering(false);
          }} />
      )}
      {open && <ResponseDrawer response={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function ResponseDrawer({ response: r, onClose }: { response: Response; onClose: () => void }) {
  const positions = (list: Response["current"]) => list.map((p) => [p.name, years(p)].filter(Boolean).join(", ")).join("\n");
  return (
    <Dialog title={r.name} variant="drawer" onClose={onClose}>
      <p className="text-[13px] text-muted">Submitted {date(r.submittedAt)}{r.revision > 1 && ` (update ${r.revision})`}. Contains private answers.</p>
      {r.possibleDuplicate && (
        <p className="mt-3 rounded-lg bg-sand p-3 text-[13px]">Someone with this name already has a profile under another email. Check whether they are the same person.</p>
      )}
      <Section title="SRC email" warm>
        <Badge tone={EMAIL[r.emailStatus].tone}>{EMAIL[r.emailStatus].label}</Badge>
        <div className="mt-3"><Facts rows={[["Recipient", r.emailRecipient], ["Last error", r.emailError]]} /></div>
      </Section>
      <Section title="Personal & contact">
        <Facts rows={[["Email", r.email], ["Phone", r.phone], ["Date of birth", r.birthday], ["Ethnicity", r.ethnicity.join(", ")], ["State", r.state], ["SR / Region", r.location], ["NeighborNet", r.neighborNet]]} />
      </Section>
      <Section title="YM involvement">
        <Facts rows={[["Involvement", r.involvement], ["Current", positions(r.current)], ["Previous", positions(r.previous)]]} />
      </Section>
      <Section title="Skills & background">
        <Facts rows={[
          ["Skills", r.skills.join(", ")], ["YM interests", r.interests.join(", ")], ["Status", r.educationStatus.join(", ")],
          ["Schools", r.schools.join(", ")], ["Fields of study", r.fieldsOfStudy.join(", ")], ["Occupation", r.occupation],
          ["Organizations", r.organizations.join(", ")], ["Anything else", r.anythingElse],
        ]} />
      </Section>
    </Dialog>
  );
}
