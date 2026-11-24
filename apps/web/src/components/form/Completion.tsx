import type { RefObject } from "react";
import { DirectoryLink } from "@/components/ui/DirectoryLink";
import { BlobCard } from "./BlobCard";
import { FormProgress } from "./FormProgress";

export function Completion({ headingRef, cycleYear }: { headingRef: RefObject<HTMLHeadingElement | null>; cycleYear: number }) {
  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col">
      <div className="px-4 pt-[25px] sm:px-6">
        <FormProgress current={5} />
      </div>
      <main className="grid flex-1 place-items-center px-4 py-10">
        <BlobCard labelledBy="thanks-heading">
          <div aria-hidden className="grid size-16 place-items-center rounded-full bg-mint-100 text-[36px] font-bold text-forest-600">
            ✓
          </div>
          <p lang="ar" dir="rtl" className="mt-[11px] font-arabic text-[25px] font-semibold text-forest-600">
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
        </BlobCard>
      </main>
    </div>
  );
}
