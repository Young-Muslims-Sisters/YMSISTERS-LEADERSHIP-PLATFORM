import Link from "next/link";
import type { ReactNode } from "react";
import { BlobCard } from "@/components/form/BlobCard";
import { FormHeader } from "@/components/form/FormHeader";
import { secondaryButton } from "./buttons";

// Full-page message with a way back to the start.
export function MessagePage({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <FormHeader />
      <main className="grid flex-1 place-items-center px-4 py-10">
        <BlobCard labelledBy="message-heading">
          <h1 id="message-heading" className="font-display text-[24px] leading-[1.4] text-forest-950 uppercase sm:text-[28px]">{title}</h1>
          <p className="mt-4 text-[15px] text-ink">{text}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {children}
            <Link href="/" className={secondaryButton}>Back to start</Link>
          </div>
        </BlobCard>
      </main>
    </div>
  );
}
