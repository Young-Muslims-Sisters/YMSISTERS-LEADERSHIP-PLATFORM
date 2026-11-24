import { Suspense } from "react";
import { connection } from "next/server";
import { AnnualForm } from "@/components/form/AnnualForm";
import { env } from "@/lib/server/env";
import { loadReferenceData } from "@/lib/server/reference";

export default function Page() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <Suspense fallback={<p className="px-6 py-16 text-center text-[14px] text-muted">Loading the form…</p>}>
        <FormLoader />
      </Suspense>
    </div>
  );
}

async function FormLoader() {
  await connection();
  const reference = await loadReferenceData();
  return <AnnualForm reference={reference} cycleYear={env.cycleYear} />;
}
