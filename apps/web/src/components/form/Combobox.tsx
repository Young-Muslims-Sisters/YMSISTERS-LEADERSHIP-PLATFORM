"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { inputClass } from "./fields";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type ComboOption = { value: string; label: string; group?: string };

type Props = {
  id: string;
  options: readonly ComboOption[];
  // The selected option. Multi-select pickers pass null and use selectedValues.
  selected: ComboOption | null;
  // Called with null when Backspace clears the selection (multi-select: the last chip).
  onSelect: (option: ComboOption | null) => void;
  placeholder: string;
  // Multi-select: these options are checked and the list stays open while choosing.
  selectedValues?: ReadonlySet<string>;
  chips?: ReactNode;
  allowCustom?: boolean;
  // Opens the list upward when there is no room below (for dialogs, which do not scroll).
  flip?: boolean;
  // Called instead of opening, while another answer is needed first.
  onBlocked?: () => void;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
};

const CUSTOM_PREFIX = "custom:";
// Long lists (e.g. schools) show the first matches; typing narrows them down.
const MAX_VISIBLE = 200;

export const isCustomOption = (o: ComboOption) => o.value.startsWith(CUSTOM_PREFIX);

// Searchable select following the WAI-ARIA combobox pattern.
export function Combobox({
  id, options, selected, onSelect, placeholder, selectedValues, chips, allowCustom, flip, onBlocked, invalid, describedBy, labelledBy,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [upward, setUpward] = useState(false);
  const multiple = selectedValues !== undefined;

  const trimmed = query.trim();
  const matches = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return options;
    const hits = options.filter((o) => o.label.toLowerCase().includes(q));
    // "Starts with" matches come first, within each group.
    const groups = [...new Set(hits.map((o) => o.group))];
    const startsWith = (o: ComboOption) => o.label.toLowerCase().startsWith(q);
    return hits.toSorted(
      (x, y) => groups.indexOf(x.group) - groups.indexOf(y.group) || Number(startsWith(y)) - Number(startsWith(x)),
    );
  }, [options, trimmed]);

  const exactMatch = matches.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());
  const items: ComboOption[] = matches.slice(0, MAX_VISIBLE);
  if (allowCustom && trimmed && !exactMatch) items.push({ value: `${CUSTOM_PREFIX}${trimmed}`, label: trimmed });

  const isSelected = (o: ComboOption) => (multiple ? selectedValues.has(o.value) : selected?.value === o.value);

  // Scroll the page so an opened list clears the fixed footer.
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, items.length]);

  // Keep the keyboard-highlighted option in view.
  useEffect(() => {
    if (open) listRef.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    if (onBlocked) return;
    const box = inputRef.current?.getBoundingClientRect();
    if (flip && box) setUpward(window.innerHeight - box.bottom < 280 && box.top > window.innerHeight - box.bottom);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const choose = (option: ComboOption) => {
    onSelect(option);
    if (!multiple) return close();
    if (trimmed) {
      setQuery("");
      setActive(0);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (onBlocked) {
      // Tab still moves past the field.
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key.length === 1) {
        e.preventDefault();
        onBlocked();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) show();
      else setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    } else if (e.key === "Backspace" && !query && (selected || selectedValues?.size)) {
      onSelect(null);
    }
  };

  const input = (
    <input
      ref={inputRef}
      id={id}
      type="text"
      role="combobox"
      autoComplete="off"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={open && items[active] ? `${listId}-opt-${active}` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      placeholder={selected?.label ?? (selectedValues?.size ? "" : placeholder)}
      value={open ? query : (selected?.label ?? "")}
      onChange={(e) => {
        setQuery(e.target.value);
        show();
        setActive(0);
      }}
      onFocus={show}
      onClick={() => (onBlocked ? onBlocked() : show())}
      onBlur={close}
      onKeyDown={onKeyDown}
      className={
        multiple
          ? "h-8 min-w-12 flex-1 cursor-pointer truncate bg-transparent text-base text-ink outline-none! placeholder:text-muted sm:text-[13px]"
          : `${inputClass} cursor-pointer truncate pr-10`
      }
    />
  );

  return (
    <div className="relative">
      {multiple ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) inputRef.current?.focus();
          }}
          className="flex min-h-[50px] cursor-pointer flex-wrap items-center gap-1.5 rounded-[9px] border-[1.8px] border-sage-300 bg-white py-[7px] pr-10 pl-[14px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest-600"
        >
          {chips}
          {input}
        </div>
      ) : (
        input
      )}
      <ChevronDownIcon
        className={`pointer-events-none absolute top-[17px] right-3.5 size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute z-30 max-h-64 w-full ${upward ? "bottom-full mb-1" : "mt-1"} overflow-auto rounded-[9px] border border-sage-200 bg-white py-1 shadow-card`}
        >
          {items.length === 0 && (
            <li className="px-3.5 py-2.5 text-[13px] text-muted" role="presentation">
              {allowCustom ? "Type to add your own" : "No matches"}
            </li>
          )}
          {items.map((o, i) => (
            <li key={o.value} role="presentation">
              {o.group && o.group !== items[i - 1]?.group && (
                <div className="bg-sand px-3.5 py-2 text-[12px] font-bold tracking-wide text-forest-950 uppercase">{o.group}</div>
              )}
              <div
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={isSelected(o)}
                data-active={i === active || undefined}
                onClick={() => choose(o)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] ${
                  i === active ? "bg-mint-100 text-forest-950" : "text-ink"
                } ${isSelected(o) ? "font-semibold" : ""}`}
              >
                <span>{isCustomOption(o) ? <>Add “{o.label}”</> : o.label}</span>
                {isSelected(o) && <CheckIcon className="size-4 shrink-0 text-forest-600" />}
              </div>
            </li>
          ))}
          {matches.length > MAX_VISIBLE && (
            <li className="px-3.5 py-2.5 text-[12px] text-muted" role="presentation">Keep typing to narrow the list</li>
          )}
        </ul>
      )}
    </div>
  );
}
