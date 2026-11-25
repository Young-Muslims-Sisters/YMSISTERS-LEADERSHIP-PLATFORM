import type { Metadata } from "next";
import { FormHeader } from "@/components/form/FormHeader";
import { BackToForm } from "@/components/ui/BackToForm";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = { title: "YM Glossary" };

export default function GlossaryPage() {
  return (
    <>
      <FormHeader />
      <main className="mx-auto w-full max-w-[860px] px-4 py-10 sm:px-6">
        <div className="mb-6"><BackToForm /></div>
        <h1 className="font-display text-[26px] text-forest-950 uppercase sm:text-[32px]">YM Glossary</h1>
        <p className="text-[15px] text-muted">Common terms you’ll see across Young Muslims.</p>

        {GLOSSARY.map(({ title, terms }) => (
          <section key={title} aria-labelledby={title} className="mt-10">
            <h2 id={title} className="mb-3 text-[13px] font-bold tracking-wide text-forest-600 uppercase">{title}</h2>
            <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-sage-200 bg-white shadow-panel">
              {terms.map((t) => (
                <div key={t.short} className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-[88px_1fr] sm:px-6">
                  <dt className="contents">
                    <span className="h-fit w-fit rounded-lg bg-sand px-2.5 py-1 text-[13px] font-bold text-forest-950">{t.short}</span>
                    {t.name && <span className="text-[16px] font-bold text-forest-950">{t.name}</span>}
                  </dt>
                  <dd className="text-[14px] leading-relaxed text-ink sm:col-start-2">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <div className="mt-8"><BackToForm /></div>
      </main>
    </>
  );
}
