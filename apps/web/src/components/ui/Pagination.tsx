"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/form/icons";

const PAGE_SIZE = 50;

// One page of a list. Goes back to page 1 whenever `resetKey` changes.
export function usePaged<T>(items: T[], resetKey: string) {
  const [state, setState] = useState({ page: 1, resetKey });
  if (state.resetKey !== resetKey) setState({ page: 1, resetKey });
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const start = (page - 1) * PAGE_SIZE;
  return {
    visible: items.slice(start, start + PAGE_SIZE),
    pagination: {
      page,
      pages,
      from: start + 1,
      to: Math.min(start + PAGE_SIZE, items.length),
      total: items.length,
      onChange: (next: number) => {
        setState({ page: next, resetKey });
        window.scrollTo({ top: 0 });
      },
    },
  };
}

// Nearby pages plus the first and last; null marks a gap.
function pageList(page: number, pages: number): (number | null)[] {
  const shown = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? [null, n] : [n]));
}

const buttonClass = "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-[13px] font-semibold";

export function Pagination({ page, pages, from, to, total, onChange }: ReturnType<typeof usePaged>["pagination"]) {
  if (pages === 1) return null;
  return (
    <nav aria-label="Pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-muted">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)}
          className={`${buttonClass} text-forest-950 enabled:hover:bg-mint-100 disabled:opacity-30`}>
          <ChevronLeftIcon className="size-4" />
        </button>
        {pageList(page, pages).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 text-muted">…</span>
          ) : (
            <button key={n} type="button" aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}
              className={`${buttonClass} ${n === page ? "bg-forest-950 text-white" : "text-forest-950 hover:bg-mint-100"}`}>
              {n}
            </button>
          ),
        )}
        <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onChange(page + 1)}
          className={`${buttonClass} text-forest-950 enabled:hover:bg-mint-100 disabled:opacity-30`}>
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </nav>
  );
}
