import Link from "next/link";
import { Suspense } from "react";
import { BlobCard } from "@/components/form/BlobCard";
import { FormHeader } from "@/components/form/FormHeader";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { localLoginEnabled, safeNext } from "@/lib/server/access";
import { YM_DOMAIN } from "@/lib/ym";
import { signInLocally, signInWithGoogle } from "./actions";

const ERRORS: Record<string, string> = {
  access: `That account doesn’t have access. Please use your YM email, ending in @${YM_DOMAIN}.`,
  local: "Google sign-in only works on the live site. Use the test buttons below.",
  failed: "We couldn’t sign you in. Please try again.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <FormHeader />
      <main className="grid flex-1 place-items-center overflow-clip px-4 py-10">
        <BlobCard labelledBy="login-heading">
          <h1 id="login-heading" className="font-display text-[24px] leading-[1.4] text-forest-950 uppercase sm:text-[28px]">
            Leadership Directory
          </h1>
          <p className="mt-4 text-[15px] text-ink">
            Sign in with your YM email, ending in <strong className="font-semibold text-forest-950">@{YM_DOMAIN}</strong>.
          </p>
          <p className="mt-1 text-[13px] text-muted">Personal email accounts won’t work.</p>
          <Suspense>
            <SignIn searchParams={searchParams} />
          </Suspense>
          <Link href="/" className="mt-6 text-[13px] font-semibold text-forest-600 hover:underline">Back to the form</Link>
        </BlobCard>
      </main>
    </div>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  return (
    <>
      {error && <p role="alert" className="mt-4 text-[13px] font-medium text-danger">{error}</p>}
      <form action={signInWithGoogle} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <button className={primaryButton}>Sign in with YM email</button>
      </form>
      {localLoginEnabled() && (
        <form action={signInLocally} className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-line pt-6">
          <input type="hidden" name="next" value={next} />
          <p className="w-full text-[12px] text-muted">Local testing only</p>
          <button name="account" value="member" className={secondaryButton}>Test member</button>
          <button name="account" value="it-admin" className={secondaryButton}>Test IT admin</button>
        </form>
      )}
    </>
  );
}
