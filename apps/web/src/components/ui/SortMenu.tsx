"use client";

import { SortIcon } from "@/components/form/icons";
import { usePopover } from "@/components/form/usePopover";
import { ToolbarButton } from "./display";

type Props<T extends string> = { options: Record<T, string>; value: T; onChange: (value: T) => void };

export function SortMenu<T extends string>({ options, value, onChange }: Props<T>) {
  const { open, setOpen, ref } = usePopover<HTMLDivElement>();
  return (
    <div ref={ref} className="relative flex-1 [&:last-child>button]:rounded-r-[9px] [&>button]:w-full [&>button]:rounded-none">
      <ToolbarButton icon={<SortIcon />} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>Sort</ToolbarButton>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 w-56 rounded-xl border border-sage-300 bg-white p-2 shadow-card">
          <p className="px-3 py-2 text-[13px] font-bold text-forest-950">Sort by</p>
          {(Object.entries(options) as [T, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === value}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-[13px] ${key === value ? "bg-mint-100 font-semibold text-forest-950" : "text-ink hover:bg-mint-25"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
