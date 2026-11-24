import { Dialog } from "@/components/ui/Dialog";
import { Facts, Pill, Section } from "@/components/ui/display";
import { fullName, type Person, type Position } from "@/lib/directory/types";
import { StatusBadge } from "./Directory";

export const years = (p: Position) => [p.fromYear, p.toYear].filter(Boolean).join("–");

export function ProfileDrawer({ person: p, onClose }: { person: Person; onClose: () => void }) {
  const list = (values: string[]) => values.join(", ");
  return (
    <Dialog title="Leadership Profile" variant="drawer" onClose={onClose}>
      <div className="rounded-xl border border-sage-300 p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-mint-100 font-bold text-forest-600">
            {p.firstName[0]}{p.lastName[0]}
          </span>
          <div>
            <p className="text-[18px] font-bold text-forest-950">{fullName(p)}</p>
            <StatusBadge status={p.status} />
          </div>
        </div>
        <div className="mt-4 grid gap-1 text-[13px]">
          <a href={`mailto:${p.email}`} className="break-all text-forest-600 hover:underline">{p.email}</a>
          {p.phone && <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="text-forest-600 hover:underline">{p.phone}</a>}
        </div>
        <div className="mt-4 border-t border-sage-300 pt-4">
          <Facts rows={[["SR / Region", p.location], ["NeighborNet", p.neighborNet], ["State", p.state]]} />
        </div>
      </div>

      <Section title="Current Leadership" warm>
        {p.current.length === 0 && <p className="text-[13px] text-muted">No current position.</p>}
        <ul className="grid gap-2">
          {p.current.map((c, i) => (
            <li key={i} className="rounded-lg border border-sage-300 bg-white px-3 py-2">
              <p className="text-[13px] font-semibold text-forest-950">{c.name}</p>
              {c.place && <p className="text-[12px] text-muted">{c.place}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Leadership History" warm>
        {p.previous.length === 0 && <p className="text-[13px] text-muted">No previous positions.</p>}
        <ul className="grid gap-2 text-[13px]">
          {p.previous.map((c, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>{c.name}</span>
              <span className="shrink-0 text-muted">{years(c)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills & Interests">
        {([["Skills", p.tags.skill], ["YM Interests", p.tags.interest]] as const).map(([label, values]) => (
          <div key={label} className="mb-3 last:mb-0">
            <p className="mb-1.5 text-[13px] font-semibold text-forest-950">{label}</p>
            <div className="flex flex-wrap gap-1.5 text-[13px]">
              {values.length > 0 ? values.map((v) => <Pill key={v}>{v}</Pill>) : "—"}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Education & Background">
        <Facts rows={[
          ["School(s)", list(p.tags.school)],
          ["Field of study", list(p.tags.field_of_study)],
          ["Occupation", list(p.tags.occupation)],
          ["Organizations", list(p.tags.organization)],
        ]} />
      </Section>
    </Dialog>
  );
}
