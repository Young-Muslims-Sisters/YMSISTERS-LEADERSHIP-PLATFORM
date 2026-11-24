import type { Metadata } from "next";
import { Suspense } from "react";
import { Responses } from "@/components/admin/Responses";
import { AppShell, PageLoading } from "@/components/ui/AppShell";
import { requireItAdmin } from "@/lib/server/access";
import { env } from "@/lib/server/env";
import { loadResponses } from "@/lib/server/responses";

export const metadata: Metadata = { title: "YM Sisters IT Dashboard" };

export default function AdminPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminLoader />
    </Suspense>
  );
}

async function AdminLoader() {
  const access = await requireItAdmin();
  const { responses, profileCount } = await loadResponses();
  return (
    <AppShell access={access} active="/admin">
      <Responses responses={responses} profileCount={profileCount} cycleYear={env.cycleYear} />
    </AppShell>
  );
}
