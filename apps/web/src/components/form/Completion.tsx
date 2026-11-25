import type { RefObject } from "react";
import { DirectoryLink } from "@/components/ui/DirectoryLink";
import { BlobCard } from "./BlobCard";
import { Confetti } from "./Confetti";
import { FormProgress } from "./FormProgress";

type Props = { headingRef: RefObject<HTMLHeadingElement | null>; cycleYear: number; onRestart: () => void };

export function Completion({ headingRef, cycleYear, onRestart }: Props) {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] sm:min-h-[calc(100dvh-80px)] flex-col">
      <Confetti />
      <div className="relative z-10 px-4 pt-3 sm:px-6 sm:pt-[25px]">
        <FormProgress current={5} />
      </div>
      <main className="grid flex-1 place-items-center overflow-x-clip px-4 py-10">
        <BlobCard labelledBy="thanks-heading">
          <div aria-hidden className="grid size-16 place-items-center rounded-full bg-mint-100 text-[36px] font-bold text-forest-600">
            ✓
          </div>
          <p lang="ar" dir="rtl" className="arabic-reveal mt-[11px] font-arabic text-[25px] font-semibold text-forest-600">
            جزاكِ الله خيرًا
          </p>
          <h1
            id="thanks-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 font-display text-[24px] leading-[1.5] text-forest-950 outline-none sm:text-[26px]"
          >
            Your {cycleYear} information
            <br />
            has been submitted!
          </h1>
          <p className="mt-5 text-[15px] text-ink">Thank you for helping keep YM connected.</p>
          <div className="mt-6"><DirectoryLink /></div>
          <button type="button" onClick={onRestart} className="mt-4 px-3 py-2 text-[13px] font-semibold text-forest-600 hover:underline">
            Back to start
          </button>
        </BlobCard>
      </main>
    </div>
  );
}
