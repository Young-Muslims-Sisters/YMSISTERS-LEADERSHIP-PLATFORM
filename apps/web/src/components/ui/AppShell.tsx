import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/login/actions";

type Path = "/directory" | "/admin";

const linkClass = "rounded-lg px-2 py-2 whitespace-nowrap sm:px-3 text-[13px] font-semibold text-forest-950 hover:bg-mint-100";

// Top bar for signed-in pages. IT admins also get a link between their two pages.
export function AppShell({ access, active, children }: { access: string; active: Path; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-app">
      <header className="border-b-2 border-cream-line bg-cream">
        <div className="mx-auto flex min-h-16 max-w-[1240px] flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-7">
          <Link href="/" aria-label="Young Muslims, start page" className="font-display text-[17px] text-forest-950">YOUNG MUSLIMS</Link>
          <div className="flex items-center gap-1 max-sm:-ml-2">
            <Link href="/" className={linkClass}>Form</Link>
            {access === "it_admin" &&
              (active === "/admin" ? (
                <Link href="/directory" className={linkClass}>Leadership Directory</Link>
              ) : (
                <Link href="/admin" className={linkClass}>IT Dashboard</Link>
              ))}
            <form action={signOut}>
              <button className={linkClass}>Sign out</button>
            </form>
          </div>
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
        <h1 className="font-display text-[24px] text-forest-950 uppercase sm:text-[30px]">{children}</h1>
        {aside}
      </div>
      <p className="text-[14px] text-muted">{subtitle}</p>
    </>
  );
}

export function PageLoading() {
  return <p className="px-6 py-24 text-center text-[14px] text-muted">Loading…</p>;
}
