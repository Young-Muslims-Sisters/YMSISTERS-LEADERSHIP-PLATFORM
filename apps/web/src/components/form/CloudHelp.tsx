"use client";

import { useId } from "react";
import { CLOUD } from "@/lib/glossary";
import { ArrowRightIcon } from "./icons";
import { usePopover } from "./usePopover";

export function CloudHelp() {
  const { open, setOpen, ref } = usePopover<HTMLDivElement>();
  const panelId = useId();

  return (
    <div ref={ref} className={`relative inline-flex ${open ? "z-30" : "z-10"}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="What is Cloud?"
        onClick={() => setOpen(!open)}
        className={`grid size-5 place-items-center rounded-full text-[12px] leading-none font-semibold transition-colors ${
          open ? "bg-forest-600 text-white" : "bg-mint-100 text-forest-600 hover:bg-forest-600 hover:text-white"
        }`}
      >
        ?
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="What is Cloud?"
          className="absolute top-7 left-0 w-[min(320px,80vw)] rounded-xl border border-sage-200 bg-white p-4 text-[13px] leading-relaxed text-ink shadow-card max-sm:-left-44"
        >
          <p className="font-bold text-forest-950">What is Cloud?</p>
          <p className="mt-1">{CLOUD.definition}</p>
          <p className="mt-2">Cloud is not assigned automatically, so please select it each year.</p>
          {/* A new tab, so answers in progress are not lost. */}
          <a
            href="/glossary"
            target="_blank"
            rel="noopener"
            className="group mt-3 inline-flex items-center gap-1.5 font-semibold text-forest-600 hover:underline"
          >
            View full glossary
            <span className="sr-only">(opens in a new tab)</span>
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </a>
        </div>
      )}
    </div>
  );
}
