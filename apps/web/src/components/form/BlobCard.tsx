/* eslint-disable @next/next/no-img-element -- decorative SVGs */
import type { ReactNode } from "react";

const blobClass = "pointer-events-none absolute top-1/2 max-w-none -translate-y-1/2 max-lg:hidden";

// Centered white card on the organic YM shapes (welcome and thank-you screens).
export function BlobCard({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <div className="screen-enter relative w-full max-w-[600px]">
      <img alt="" aria-hidden src="/form/thanks-blob-left.svg" className={`${blobClass} -left-[115px] rotate-[-157.46deg]`} />
      <img alt="" aria-hidden src="/form/thanks-blob-right.svg" className={`${blobClass} -right-[115px]`} />
      <section
        aria-labelledby={labelledBy}
        className="relative flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-[#d8e6dc] bg-white px-6 py-10 text-center shadow-panel sm:px-12"
      >
        {children}
      </section>
    </div>
  );
}
