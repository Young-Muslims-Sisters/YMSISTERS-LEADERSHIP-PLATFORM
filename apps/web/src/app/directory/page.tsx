import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory } from "@/components/directory/Directory";
import { AppShell, PageLoading } from "@/components/ui/AppShell";
import { requireMember } from "@/lib/server/access";
import { loadDirectory } from "@/lib/server/directory";
import { loadReferenceData } from "@/lib/server/reference";

export const metadata: Metadata = { title: "YM Sisters Leadership Directory" };

export default function DirectoryPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <DirectoryLoader />
    </Suspense>
  );
}

async function DirectoryLoader() {
  const access = await requireMember();
  const [people, reference] = await Promise.all([loadDirectory(), loadReferenceData()]);
  return (
    <AppShell access={access} active="/directory">
      <Directory people={people} reference={reference} />
    </AppShell>
  );
}
