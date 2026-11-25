/* eslint-disable @next/next/no-img-element -- decorative SVGs */
import type { ReactNode } from "react";

const blobClass = "pointer-events-none absolute max-w-none lg:top-1/2 lg:-translate-y-1/2 max-lg:w-60";

// Centered white card on the organic YM shapes (welcome and thank-you screens).
export function BlobCard({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <div className="screen-enter relative w-full max-w-[600px]">
      <img alt="" aria-hidden src="/form/thanks-blob-left.svg" className={`${blobClass} rotate-[-157.46deg] max-lg:-bottom-20 max-lg:-left-20 lg:-left-[115px]`} />
      <img alt="" aria-hidden src="/form/thanks-blob-right.svg" className={`${blobClass} max-lg:-top-20 max-lg:-right-20 lg:-right-[115px]`} />
      <section
        aria-labelledby={labelledBy}
        className="relative flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-[#d8e6dc] bg-white px-6 py-10 text-center shadow-panel sm:px-12"
      >
        {children}
      </section>
    </div>
  );
}
