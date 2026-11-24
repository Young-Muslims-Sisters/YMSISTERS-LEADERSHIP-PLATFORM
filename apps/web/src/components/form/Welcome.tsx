import Image from "next/image";
import { DirectoryLink } from "@/components/ui/DirectoryLink";
import { BlobCard } from "./BlobCard";
import { PrimaryButton } from "./FormFooter";

export function Welcome({ cycleYear, onStart }: { cycleYear: number; onStart: () => void }) {
  return (
    <div className="flex min-h-dvh max-sm:flex-col">
      {/* Brand strip: vertical on larger screens, along the top on phones. */}
      <div className="relative flex shrink-0 items-center justify-center bg-mint-100 max-sm:h-20 sm:w-28">
        <Image
          src="/ym-logo.png"
          alt="Young Muslims"
          width={1882}
          height={206}
          priority
          className="h-auto w-60 max-w-none sm:absolute sm:w-[min(88dvh,680px)] sm:-rotate-90"
        />
      </div>
      <main className="grid flex-1 place-items-center overflow-x-clip px-4 py-10">
        <BlobCard labelledBy="welcome-heading">
          <h1 id="welcome-heading" className="font-display text-[24px] leading-[1.4] text-forest-950 uppercase sm:text-[32px]">
            YM {cycleYear} Leadership
            <span className="block text-[0.82em] text-forest-600">Information Form</span>
          </h1>
          <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-ink">
            This annual form helps YM maintain accurate contacts, leadership history, and interests. For current
            leadership and eligible former leadership interested in Cloud.
          </p>
          <div className="mt-8 flex flex-wrap items-start justify-center gap-3">
            <PrimaryButton onClick={onStart}>Get Started</PrimaryButton>
            <DirectoryLink />
          </div>
        </BlobCard>
      </main>
    </div>
  );
}
