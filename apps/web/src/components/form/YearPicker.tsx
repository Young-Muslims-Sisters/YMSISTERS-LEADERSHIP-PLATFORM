"use client";

import { useEffect, useRef, useState } from "react";
import { FieldError, Label, inputClass } from "./fields";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { usePopover } from "./usePopover";

const PAGE_SIZE = 12;
const FIRST_YEAR = 1990;
const navClass = "grid size-9 place-items-center rounded-lg text-forest-950 hover:bg-mint-50 disabled:opacity-30";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (year: string) => void;
  minYear?: number;
  maxYear: number;
  error?: string;
};

export function YearPicker({ id, label, value, onChange, minYear = FIRST_YEAR, maxYear, error }: Props) {
  const { open, setOpen, ref } = usePopover<HTMLDivElement>();
  const lastPage = maxYear - PAGE_SIZE + 1;
  const [start, setStart] = useState(lastPage);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const toggle = () => {
    // Open on the page that contains the chosen year.
    const pagesBack = value ? Math.max(0, Math.floor((maxYear - Number(value)) / PAGE_SIZE)) : 0;
    setStart(lastPage - pagesBack * PAGE_SIZE);
    setOpen(!open);
  };

  const pick = (year: string) => {
    onChange(year);
    setOpen(false);
    document.getElementById(id)?.focus();
  };

  return (
    <div ref={ref} className="relative">
      <Label id={`${id}-label`} htmlFor={id}>{label}</Label>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={toggle}
        className={`${inputClass} flex items-center justify-between text-left ${error ? "border-danger" : ""}`}
      >
        <span className={value ? "" : "text-muted"}>{value || "Select year"}</span>
        <CalendarIcon className="size-4 text-muted" />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`Choose ${label}`}
          className="absolute z-30 mt-1 w-full max-w-[300px] rounded-[9px] border border-sage-200 bg-white p-3 shadow-card"
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Earlier years" disabled={start <= minYear} onClick={() => setStart(start - PAGE_SIZE)} className={navClass}>
              <ChevronLeftIcon className="size-4" />
            </button>
            <span className="text-[13px] font-semibold text-forest-950">{start} – {start + PAGE_SIZE - 1}</span>
            <button type="button" aria-label="Later years" disabled={start >= lastPage} onClick={() => setStart(start + PAGE_SIZE)} className={navClass}>
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: PAGE_SIZE }, (_, i) => start + i).map((year) => {
              const selected = String(year) === value;
              return (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selected}
                  disabled={year < minYear || year > maxYear}
                  onClick={() => pick(String(year))}
                  className={`h-10 rounded-lg text-[13px] font-medium disabled:opacity-30 ${
                    selected ? "bg-forest-600 text-white" : "text-ink enabled:hover:bg-mint-50"
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => pick("")} className="mt-2 w-full rounded-lg py-2 text-[12px] font-semibold text-forest-600 hover:bg-mint-50">
              Clear
            </button>
          )}
        </div>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
