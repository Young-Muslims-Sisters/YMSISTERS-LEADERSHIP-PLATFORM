"use client";

import { useMemo, useState } from "react";
import { DownloadIcon, FilterIcon, MailIcon, PhoneIcon } from "@/components/form/icons";
import { PageTitle } from "@/components/ui/AppShell";
import { Badge, Pill, SearchBox, Toolbar, ToolbarButton } from "@/components/ui/display";
import { FilterDialog } from "@/components/ui/FilterDialog";
import { Pagination, usePaged } from "@/components/ui/Pagination";
import { SortMenu } from "@/components/ui/SortMenu";
import { filterOptions } from "@/lib/directory/filter-options";
import { FILTERS, findPeople, NO_FILTERS, SORTS, type Sort } from "@/lib/directory/filter";
import type { ReferenceData } from "@/lib/form/reference-types";
import { fullName, pills, type Person } from "@/lib/directory/types";
import { ExportDialog } from "./ExportDialog";
import { ProfileDrawer } from "./ProfileDrawer";

export function Directory({ people, reference }: { people: Person[]; reference: ReferenceData }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState<Sort>("name-asc");
  const [dialog, setDialog] = useState<"filter" | "export" | null>(null);
  const [profile, setProfile] = useState<Person | null>(null);

  const results = useMemo(() => findPeople(people, search, filters, sort), [people, search, filters, sort]);
  const options = useMemo(() => filterOptions(people, reference), [people, reference]);
  const { visible, pagination } = usePaged(results, JSON.stringify([search, filters, sort]));
  const applied = FILTERS.filter(({ key }) => filters[key].length > 0);

  return (
    <>
      <PageTitle subtitle="Find and connect with YM leadership across the US.">Leadership Directory</PageTitle>

      <div className="mt-6 flex flex-col gap-3 border-b border-sage-300 pb-6 md:flex-row">
        <SearchBox aria-label="Search the directory" placeholder="Search name, role, team, skills…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Toolbar>
          <ToolbarButton icon={<FilterIcon />} count={applied.length} onClick={() => setDialog("filter")}>Filter</ToolbarButton>
          <SortMenu options={SORTS} value={sort} onChange={setSort} />
          <ToolbarButton icon={<DownloadIcon />} onClick={() => setDialog("export")}>Export</ToolbarButton>
        </Toolbar>
      </div>

      {applied.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {applied.map(({ key, label }) => (
            <span key={key} className="inline-flex items-center gap-2 rounded-full border border-sage-300 bg-mint-100 py-1.5 pr-2 pl-3 text-[12px] font-medium text-forest-950">
              {label}: {filters[key].join(" or ")}
              <button type="button" aria-label={`Remove ${label} filter`} onClick={() => setFilters({ ...filters, [key]: [] })}
                className="grid size-5 place-items-center rounded-full hover:bg-white">×</button>
            </span>
          ))}
          <button type="button" onClick={() => setFilters(NO_FILTERS)} className="ml-auto px-2 text-[13px] font-semibold text-forest-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      <h2 aria-live="polite" className="mt-5 mb-3 text-[15px] font-bold text-forest-950 sm:mt-6 sm:mb-2 sm:font-display sm:text-[22px] sm:font-normal sm:uppercase">
        {results.length} {results.length === 1 ? "contact" : "contacts"} found
      </h2>
      <PeopleList people={visible} onOpen={setProfile} />
      <Pagination {...pagination} />

      {dialog === "filter" && (
        <FilterDialog title="Filter leadership" fields={FILTERS} options={options} value={filters}
          onClose={() => setDialog(null)}
          onApply={(value) => {
            setFilters(value);
            setDialog(null);
          }} />
      )}
      {dialog === "export" && <ExportDialog resultIds={results.map((p) => p.id)} onClose={() => setDialog(null)} />}
      {profile && <ProfileDrawer person={profile} onClose={() => setProfile(null)} />}
    </>
  );
}

export function StatusBadge({ status }: { status: Person["status"] }) {
  if (!status) return <Badge tone="gray">Not submitted</Badge>;
  return <Badge tone={status === "Cloud" ? "purple" : "green"}>{status}</Badge>;
}

const linkClass = "relative z-10 flex w-fit items-center gap-2 break-all py-0.5 max-lg:py-1.5 text-forest-600 hover:underline";
const contactIcon = "size-3.5 shrink-0";

const MAX_PILLS = 2;

// The first roles, then "+2" for the rest. The profile lists them all.
function RolePills({ roles }: { roles: string[] }) {
  const hidden = roles.slice(MAX_PILLS);
  return (
    <>
      {roles.slice(0, MAX_PILLS).map((r) => <Pill key={r}>{r}</Pill>)}
      {hidden.length > 0 && <span title={hidden.join(", ")} className="px-1 py-1 text-[12px] font-semibold text-forest-600">+{hidden.length} more</span>}
    </>
  );
}

// A table on large screens, stacked cards on small ones. The whole row opens the profile.
function PeopleList({ people, onOpen }: { people: Person[]; onOpen: (p: Person) => void }) {
  if (people.length === 0) {
    return <p className="rounded-xl border border-sage-300 bg-white p-8 text-center text-[14px] text-muted">No one matches. Try removing a filter.</p>;
  }
  return (
    <table className="block w-full text-left text-[13px] lg:table lg:rounded-xl lg:border lg:border-sage-300 lg:bg-white lg:border-separate lg:border-spacing-0 lg:overflow-hidden">
      <thead className="bg-mint-50 max-lg:sr-only">
        <tr>
          {["Name", "Role", "Contact", "SR / Region", "NN", "Active Status"].map((h) => (
            <th key={h} scope="col" className="border-b border-sage-300 px-4 py-4 font-bold text-forest-950">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="max-lg:grid max-lg:gap-3 md:max-lg:grid-cols-2">
        {people.map((p) => (
          <tr key={p.id} className="relative hover:bg-mint-25 max-lg:grid max-lg:grid-cols-[1fr_auto] max-lg:content-start max-lg:items-center max-lg:gap-x-3 max-lg:rounded-2xl max-lg:border max-lg:border-sage-200 max-lg:bg-white max-lg:p-4 max-lg:shadow-sm lg:[&>td]:border-b lg:[&>td]:border-line lg:[&>td]:px-4 lg:[&>td]:py-3.5 lg:last:[&>td]:border-b-0">
            <td className="max-lg:col-start-1 max-lg:row-start-1">
              <button type="button" onClick={() => onOpen(p)} className="flex items-center gap-3 text-left font-semibold text-forest-950 after:absolute after:inset-0 max-lg:text-[16px]">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-100 text-[13px] font-bold text-forest-600 lg:hidden">
                  {p.firstName[0]}{p.lastName[0]}
                </span>
                {fullName(p)}
              </button>
            </td>
            <td className={`max-lg:col-span-2 max-lg:row-start-3 max-lg:mt-3 ${pills(p).length ? "" : "max-lg:hidden"}`}><span className="flex flex-wrap gap-1.5"><RolePills roles={pills(p)} /></span></td>
            <td className="max-lg:col-span-2 max-lg:row-start-4 max-lg:mt-3 max-lg:border-t max-lg:border-line max-lg:pt-2">
              <a href={`mailto:${p.email}`} className={linkClass}><MailIcon className={contactIcon} />{p.email}</a>
              {p.phone && <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className={linkClass}><PhoneIcon className={contactIcon} />{p.phone}</a>}
            </td>
            <td className="max-lg:col-span-2 max-lg:row-start-2 max-lg:mt-2 max-lg:text-muted">
              {p.location ?? "—"}
              {p.neighborNet && <span className="lg:hidden"> · {p.neighborNet}</span>}
            </td>
            <td className="max-lg:hidden">{p.neighborNet ?? "—"}</td>
            <td className="max-lg:col-start-2 max-lg:row-start-1"><StatusBadge status={p.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
