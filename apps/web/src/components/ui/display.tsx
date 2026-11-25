import type { ComponentProps, ReactNode } from "react";
import { SearchIcon } from "@/components/form/icons";

// Small read-only pieces shared by the directory and the IT dashboard.

const TONES = {
  green: "bg-mint-100 text-forest-600",
  purple: "bg-[#ece4f7] text-[#6b4fa0]",
  yellow: "bg-sand text-forest-950",
  red: "bg-[#fbe4e4] text-danger",
  gray: "bg-line/60 text-muted",
};
export type Tone = keyof typeof TONES;

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-sage-300 bg-mint-100 px-3 py-1 text-[12px] font-medium text-forest-950">{children}</span>;
}

export function Section({ title, warm, children }: { title: string; warm?: boolean; children: ReactNode }) {
  return (
    <section className={`mt-4 rounded-xl border border-sage-300 p-4 ${warm ? "bg-sand/40" : "bg-white"}`}>
      <h3 className="mb-3 text-[12px] font-bold tracking-wide text-forest-950 uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function Facts({ rows }: { rows: [label: string, value: string | null | undefined][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2.5 text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="break-words whitespace-pre-wrap text-ink">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SearchBox(props: ComponentProps<"input">) {
  return (
    <div className="relative min-w-0 flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-forest-600" />
      <input
        type="search"
        className="h-12 w-full rounded-[9px] border-[1.8px] border-sage-300 bg-white pr-4 pl-11 text-base text-ink placeholder:text-muted sm:text-[14px]"
        {...props}
      />
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="relative flex h-12 shrink-0 items-stretch divide-x divide-white/20 rounded-[9px] bg-forest-950 shadow-sm">{children}</div>;
}

type ToolbarButtonProps = ComponentProps<"button"> & { icon: ReactNode; count?: number };

export function ToolbarButton({ icon, count = 0, children, ...props }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-full flex-1 items-center justify-center gap-2 px-2 sm:px-5 text-[14px] font-semibold text-white transition-colors first:rounded-l-[9px] last:rounded-r-[9px] hover:bg-forest-600 [&_svg]:size-[18px]"
      {...props}
    >
      {icon}
      {children}
      {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-sand text-[11px] text-forest-950">{count}</span>}
    </button>
  );
}
