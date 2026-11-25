"use client";
/* eslint-disable @next/next/no-img-element -- decorative SVGs */
import { useState } from "react";
import { FORM_STEPS } from "@/lib/form/options";

const BLOBS = ["upcoming", "active", "complete"] as const;
const fade = (visible: boolean) => `transition-opacity duration-300 motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`;

type Props = {
  // Index of the current section (0-4), or 5 when everything is done.
  current: number;
};

// Five-step progress bar: the finished step pops, the line fills, then the next step lights up.
export function FormProgress({ current }: Props) {
  const allDone = current >= FORM_STEPS.length;
  const [last, setLast] = useState({ current, forward: allDone });
  if (last.current !== current) setLast({ current, forward: current > last.current });
  return (
    <nav aria-label="Form progress" className="mx-auto w-full max-w-[940px]">
      <ol className="grid grid-cols-5">
        {FORM_STEPS.map((step, i) => {
          const state = i < current ? "complete" : i === current ? "active" : "upcoming";
          const iconOn = state !== "upcoming";
          return (
            <li key={step.key} className="relative flex flex-col items-center" aria-current={state === "active" ? "step" : undefined}>
              {i < FORM_STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute top-[31px] left-[calc(50%+26px)] h-1 w-[calc(100%-52px)] sm:top-10 sm:left-[calc(50%+31px)] sm:w-[calc(100%-62px)] overflow-hidden rounded-full bg-line"
                >
                  <div
                    className={`h-full origin-left rounded-full bg-forest-600 transition-transform duration-500 ease-out motion-reduce:transition-none ${
                      i < current ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </div>
              )}
              <div className={`${last.forward && i === current - 1 ? "step-pop" : ""} ${state === "active" && last.forward ? "[&_img]:delay-400" : ""} relative mt-2 grid h-[50px] w-[46px] sm:h-[67px] sm:w-[62px] place-items-center`}>
                {/* All versions are stacked and cross-faded, so moving between steps is smooth. */}
                {BLOBS.map((blob) => (
                  <img key={blob} alt="" aria-hidden src={`/form/step-blob-${blob}.svg`}
                    className={`absolute inset-0 size-full ${fade(blob === state)}`} />
                ))}
                {/* The first step is never upcoming, so it has no "off" icon. */}
                {(i === 0 ? (["on"] as const) : (["off", "on"] as const)).map((v) => (
                  <img key={v} alt="" aria-hidden src={`/form/icon-${step.icon}-${v}.svg`}
                    className={`col-start-1 row-start-1 relative max-w-none max-sm:scale-75 ${fade((v === "on") === iconOn)}`} />
                ))}
              </div>
              <span
                className={`mt-[11px] px-1 text-center text-[12px] leading-normal ${
                  allDone
                    ? "font-semibold text-forest-950"
                    : state === "active"
                      ? "font-bold text-forest-950"
                      : state === "complete"
                        ? "font-medium text-ink"
                        : "font-medium text-muted"
                } max-sm:sr-only`}
              >
                {step.label}
                <span className="sr-only">
                  {state === "complete" ? " (completed)" : state === "active" ? " (current section)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
