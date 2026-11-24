import Link from "next/link";
import { ArrowRightIcon } from "@/components/form/icons";

export function DirectoryLink() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Link
        href="/directory"
        className="group inline-flex h-11 items-center gap-2.5 rounded-lg border border-forest-600 bg-white px-6 text-[15px] font-semibold text-forest-950 transition-colors hover:bg-mint-100"
      >
        Go to Directory
        <ArrowRightIcon className="size-4 text-forest-600 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
      </Link>
      <span className="text-[12px] text-muted">YM email required</span>
    </div>
  );
}
