"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/form/icons";

// The glossary opens in its own tab, so this closes it and returns to the answers in progress.
// If the browser keeps the tab open, it goes to the start page instead.
export function BackToForm() {
  const router = useRouter();
  return (
    <Link
      href="/"
      prefetch={false}
      onClick={(e) => {
        e.preventDefault();
        window.close();
        setTimeout(() => router.push("/"), 200);
      }}
      className="inline-flex items-center gap-2 py-2 text-[14px] font-semibold text-forest-600 hover:underline"
    >
      <ArrowRightIcon className="size-4 rotate-180" />
      Back to the form
    </Link>
  );
}
