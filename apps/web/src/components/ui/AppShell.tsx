import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/login/actions";

type Path = "/directory" | "/admin";

const PAGES = [
  { href: "/", label: "Form" },
  { href: "/directory", label: "Leadership Directory" },
  { href: "/admin", label: "IT Dashboard" },
] as const;

// Top bar for signed-in pages. Only IT admins see the dashboard tab.
export function AppShell({ access, active, children }: { access: string; active: Path; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-app">
      <header className="border-b-2 border-cream-line bg-cream">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 px-4 max-sm:pt-2 sm:h-16 sm:px-7">
          <p className="mr-auto font-display text-[17px] leading-normal text-forest-950">YOUNG MUSLIMS</p>
          <nav aria-label="Pages" className="flex h-full gap-5 max-sm:order-last max-sm:w-full max-sm:gap-4">
            {PAGES.filter((p) => p.href !== "/admin" || access === "it_admin").map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={p.href === active ? "page" : undefined}
                className={`-mb-0.5 flex min-h-11 items-center border-b-2 text-[13px] font-semibold whitespace-nowrap ${
                  p.href === active ? "border-forest-950 text-forest-950" : "border-transparent text-forest-600 hover:text-forest-950"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button className="h-9 rounded-lg border border-sage-300 bg-white px-3 text-[13px] font-semibold text-forest-950 hover:bg-mint-25">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] p-4 sm:p-7 lg:py-10">{children}</main>
    </div>
  );
}

export function PageTitle({ children, subtitle, aside }: { children: ReactNode; subtitle: string; aside?: ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-[22px] leading-normal text-forest-950 uppercase sm:text-[30px]">{children}</h1>
        {aside}
      </div>
      <p className="mt-1 text-[14px] text-muted">{subtitle}</p>
    </>
  );
}

export function PageLoading() {
  return <p className="px-6 py-24 text-center text-[14px] text-muted">Loading…</p>;
}
