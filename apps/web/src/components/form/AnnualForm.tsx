"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import type { ReferenceData } from "@/lib/form/reference-types";
import {
  connectionsSchema, contactSchema, currentPositionsSchema, educationSchema, emptyForm, fieldErrors,
  involvementSchema, personalSchema, previousPositionsSchema, skillsSchema, type AnnualFormValues,
} from "@/lib/form/schema";
import { Completion } from "./Completion";
import { FormFooter, PrimaryButton } from "./FormFooter";
import { FormHeader } from "./FormHeader";
import { FormProgress } from "./FormProgress";
import { ConnectionsScreen } from "./screens/ConnectionsScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { CurrentScreen } from "./screens/CurrentScreen";
import { EducationScreen } from "./screens/EducationScreen";
import { InvolvementScreen } from "./screens/InvolvementScreen";
import { PersonalScreen } from "./screens/PersonalScreen";
import { PreviousScreen } from "./screens/PreviousScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { SkillsScreen } from "./screens/SkillsScreen";
import { fieldId, type Screen } from "./screens/shared";
import { Welcome } from "./Welcome";

const SCREEN_META: Record<Screen, { section: number; title: string }> = {
  personal: { section: 0, title: "Personal Information" },
  contact: { section: 1, title: "Contact Details" },
  involvement: { section: 2, title: "YM Involvement" },
  current: { section: 2, title: "Current Leadership" },
  previous: { section: 2, title: "Leadership History" },
  skills: { section: 3, title: "Skills & Contributions" },
  education: { section: 4, title: "Education & Background" },
  connections: { section: 4, title: "Background & Connections" },
  review: { section: 4, title: "Review Your Information" },
};

// The Cloud path skips Current Leadership.
function screensFor(involvement: AnnualFormValues["involvement"]): Screen[] {
  return [
    "personal", "contact", "involvement",
    ...(involvement === "cloud" ? [] : (["current"] as Screen[])),
    "previous", "skills", "education", "connections", "review",
  ];
}

// Which screen owns a field, so server-side errors can send people back to it.
function screenForField(path: string): Screen {
  const root = path.split(".")[0];
  if (["firstName", "lastName", "birthday", "ethnicity"].includes(root)) return "personal";
  if (["email", "phone", "state", "location", "neighborNetId"].includes(root)) return "contact";
  if (root === "involvement") return "involvement";
  if (root === "currentPositions") return "current";
  if (["previousPositions", "noPreviousPositions"].includes(root)) return "previous";
  if (["skills", "interests"].includes(root)) return "skills";
  if (["organizations", "anythingElse"].includes(root)) return "connections";
  return "education";
}

type Props = { reference: ReferenceData; cycleYear: number };

export function AnnualForm({ reference, cycleYear }: Props) {
  const [values, setValues] = useState<AnnualFormValues>(emptyForm);
  const [screen, setScreen] = useState<Screen>("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  // True while someone is fixing an answer they opened from the review screen.
  const [editing, setEditing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const screens = screensFor(values.involvement);
  const index = screens.indexOf(screen);
  const meta = SCREEN_META[screen];

  const set = <K extends keyof AnnualFormValues>(key: K, value: AnnualFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(next)) if (k === key || k.startsWith(`${String(key)}.`)) delete next[k];
      return next;
    });
  };

  // Move focus to the new section heading so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [screen, started, done]);

  const validate = (s: Screen): Record<string, string> => {
    const schemas: Partial<Record<Screen, z.ZodType>> = {
      personal: personalSchema, contact: contactSchema, involvement: involvementSchema,
      current: currentPositionsSchema, skills: skillsSchema, education: educationSchema, connections: connectionsSchema,
      previous: values.noPreviousPositions ? undefined : previousPositionsSchema,
    };
    const schema = schemas[s];
    if (!schema) return {};
    const result = schema.safeParse(values);
    return result.success ? {} : fieldErrors(result.error);
  };

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    requestAnimationFrame(() => {
      const target = Object.keys(errs).map((k) => document.getElementById(fieldId(k))).find(Boolean);
      target?.focus();
    });
  };

  const next = () => {
    const errs = validate(screen);
    if (Object.keys(errs).length) return showErrors(errs);
    setErrors({});
    setScreen(screens[index + 1]);
  };
  // Back to review, stopping at any screen the edit left incomplete.
  const returnToReview = () => {
    const target = screens.find((s) => Object.keys(validate(s)).length > 0);
    if (target) {
      setScreen(target);
      return showErrors(validate(target));
    }
    setErrors({});
    setEditing(false);
    setScreen("review");
  };
  const back = () => {
    setErrors({});
    if (index > 0) setScreen(screens[index - 1]);
  };

  const err = (path: string) => errors[path];

  if (!started) return <Welcome cycleYear={cycleYear} onStart={() => setStarted(true)} />;
  if (done) {
    return (
      <>
        <FormHeader />
        <Completion headingRef={headingRef} cycleYear={cycleYear} />
      </>
    );
  }

  return (
    <>
      <FormHeader />
      <div className="px-4 pt-[25px] sm:px-6">
        <FormProgress current={meta.section} />
      </div>

      <main className="mx-auto w-full max-w-[940px] px-4 pt-10 pb-32 has-[[role=dialog]]:pb-96 has-[[role=listbox]]:pb-96 sm:px-0">
        <p className="text-[12px] font-semibold text-forest-600">SECTION {meta.section + 1} OF 5</p>
        <h1
          key={screen}
          ref={headingRef}
          tabIndex={-1}
          className="screen-enter mt-0.5 mb-[30px] font-display text-[24px] leading-normal text-forest-950 uppercase outline-none sm:text-[30px]"
        >
          {meta.title}
        </h1>

        {screen === "personal" && <PersonalScreen values={values} set={set} err={err} />}
        {screen === "contact" && <ContactScreen values={values} set={set} err={err} reference={reference} />}
        {screen === "involvement" && (
          <InvolvementScreen values={values} set={set} err={err} cycleYear={cycleYear} />
        )}
        {screen === "current" && <CurrentScreen values={values} set={set} err={err} reference={reference} />}
        {screen === "previous" && <PreviousScreen values={values} set={set} err={err} reference={reference} cycleYear={cycleYear} />}
        {screen === "skills" && <SkillsScreen values={values} set={set} reference={reference} />}
        {screen === "education" && <EducationScreen values={values} set={set} reference={reference} />}
        {screen === "connections" && <ConnectionsScreen values={values} set={set} err={err} reference={reference} />}
        {screen === "review" && (
          <ReviewScreen
            values={values}
            reference={reference}
            onEdit={(s) => {
              setEditing(true);
              setScreen(s);
            }}
            onBack={back}
            onServerErrors={(errs) => {
              setEditing(true);
              setScreen(screenForField(Object.keys(errs)[0] ?? "firstName"));
              setErrors(errs);
            }}
            onDone={() => setDone(true)}
          />
        )}
      </main>

      {screen !== "review" && (
        <FormFooter onBack={index > 0 && !editing ? back : undefined}>
          {editing ? (
            <PrimaryButton onClick={returnToReview}>Save & Return to Review</PrimaryButton>
          ) : (
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          )}
        </FormFooter>
      )}
    </>
  );
}
