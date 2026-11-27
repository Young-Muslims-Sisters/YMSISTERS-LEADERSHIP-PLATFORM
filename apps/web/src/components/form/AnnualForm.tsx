"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import type { ReferenceData } from "@/lib/form/reference-types";
import {
  connectionsSchema, contactSchema, placeSchema, currentPositionsSchema, educationSchema, emptyForm, fieldErrors,
  involvementSchema, personalSchema, previousPositionsSchema, skillsSchema, type AnnualFormValues,
} from "@/lib/form/schema";
import { Completion } from "./Completion";
import { FormFooter, PrimaryButton } from "./FormFooter";
import { FormHeader } from "./FormHeader";
import { FormProgress } from "./FormProgress";
import { portfolioRoles } from "./PositionFields";
import { ConnectionsScreen } from "./screens/ConnectionsScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { CurrentScreen } from "./screens/CurrentScreen";
import { EducationScreen } from "./screens/EducationScreen";
import { InvolvementScreen } from "./screens/InvolvementScreen";
import { LocationScreen } from "./screens/LocationScreen";
import { PersonalScreen } from "./screens/PersonalScreen";
import { PreviousScreen } from "./screens/PreviousScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { SkillsScreen } from "./screens/SkillsScreen";
import { fieldId, type Screen } from "./screens/shared";
import { Welcome } from "./Welcome";

const SCREEN_META: Record<Screen, { section: number; title: string }> = {
  personal: { section: 0, title: "Personal Information" },
  contact: { section: 1, title: "Contact Details" },
  location: { section: 1, title: "Your Location" },
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
    "personal", "contact", "location", "involvement",
    ...(involvement === "cloud" ? [] : (["current"] as Screen[])),
    "previous", "skills", "education", "connections", "review",
  ];
}

// Which screen owns a field, so server-side errors can send people back to it.
function screenForField(path: string): Screen {
  const root = path.split(".")[0];
  if (["firstName", "lastName", "birthday", "ethnicity"].includes(root)) return "personal";
  if (["email", "phone", "ymEmailStatus", "ymEmail"].includes(root)) return "contact";
  if (["state", "location", "neighborNetId", "addressLine1", "addressLine2", "city", "addressState", "postalCode"].includes(root)) return "location";
  if (root === "involvement") return "involvement";
  if (root === "currentPositions") return "current";
  if (["previousPositions", "noPreviousPositions"].includes(root)) return "previous";
  if (["skills", "interests"].includes(root)) return "skills";
  if (["organizations", "anythingElse"].includes(root)) return "connections";
  return "education";
}

// What each browser history entry remembers, so Back and Forward move between screens.
type FormEntry = { id: string; screen: Screen; editing: boolean; depth: number };
type FormHistory = { id: string; depth: number; reviewDepth: number; done: boolean };

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
  const nav = useRef<FormHistory>({ id: "", depth: 0, reviewDepth: 0, done: false });

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

  // Back and Forward: entries from another page load or a finished form show the start card.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (nav.current.done) return;
      const entry = e.state?.form as FormEntry | undefined;
      const known = entry && entry.id === nav.current.id;
      nav.current.depth = known ? entry.depth : 0;
      setErrors({});
      setStarted(Boolean(known));
      if (known) {
        setScreen(entry.screen);
        setEditing(entry.editing);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Reloading or closing the tab would lose the answers, so the browser asks first.
  useEffect(() => {
    if (!started || done) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [started, done]);

  // Opens a screen as a new history entry.
  const go = (to: Screen, edit = false) => {
    const n = nav.current;
    n.id ||= Math.random().toString(36).slice(2);
    n.depth += 1;
    if (to === "review") n.reviewDepth = n.depth;
    const entry: FormEntry = { id: n.id, screen: to, editing: edit, depth: n.depth };
    window.history.pushState({ form: entry }, "");
    setScreen(to);
    setEditing(edit);
    setStarted(true);
  };
  const finish = () => {
    const { depth } = nav.current;
    nav.current.done = true;
    setDone(true);
    // Leave the submitted screens behind so Back cannot submit twice.
    if (depth > 0) window.history.go(-depth);
  };
  const restart = () => {
    nav.current = { id: "", depth: 0, reviewDepth: 0, done: false };
    setValues(emptyForm);
    setErrors({});
    setDone(false);
    setStarted(false);
    setEditing(false);
    setScreen("personal");
  };

  const validate = (s: Screen): Record<string, string> => {
    const schemas: Partial<Record<Screen, z.ZodType>> = {
      personal: personalSchema, contact: contactSchema, location: placeSchema, involvement: involvementSchema,
      current: currentPositionsSchema, skills: skillsSchema, education: educationSchema, connections: connectionsSchema,
      previous: values.noPreviousPositions ? undefined : previousPositionsSchema,
    };
    const schema = schemas[s];
    if (!schema) return {};
    const result = schema.safeParse(values);
    const errs = result.success ? {} : fieldErrors(result.error);
    // Shura roles need a portfolio; which roles those are comes from the database.
    if (s === "current") {
      const shura = portfolioRoles(reference);
      values.currentPositions.forEach((p, i) => {
        if (p.position && shura.has(p.position) && !p.portfolio) errs[`currentPositions.${i}.portfolio`] ??= "Choose your portfolio";
      });
    }
    return errs;
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
    go(screens[index + 1] ?? "review");
  };
  // Back to review, stopping at any screen the edit left incomplete.
  const returnToReview = () => {
    const target = screens.find((s) => Object.keys(validate(s)).length > 0);
    if (target) {
      go(target, true);
      return showErrors(validate(target));
    }
    window.history.go(nav.current.reviewDepth - nav.current.depth);
  };
  const back = () => window.history.back();

  const err = (path: string) => errors[path];

  if (!started) return <Welcome cycleYear={cycleYear} onStart={() => go("personal")} />;
  if (done) {
    return (
      <>
        <FormHeader />
        <Completion headingRef={headingRef} cycleYear={cycleYear} onRestart={restart} />
      </>
    );
  }

  return (
    <>
      <FormHeader />
      <div className="px-4 pt-3 sm:px-6 sm:pt-[25px]">
        <FormProgress current={meta.section} />
      </div>

      <main className="mx-auto w-full max-w-[940px] px-4 pt-7 pb-32 sm:pt-10 has-[[role=dialog]]:pb-96 has-[[role=listbox]]:pb-96 sm:px-0">
        <p className="text-[12px] font-semibold text-forest-600">SECTION {meta.section + 1} OF 5</p>
        <h1
          key={screen}
          ref={headingRef}
          tabIndex={-1}
          className="screen-enter mt-0.5 mb-5 font-display text-[21px] sm:mb-[30px] leading-normal text-forest-950 uppercase outline-none sm:text-[30px]"
        >
          {meta.title}
        </h1>

        {screen === "personal" && <PersonalScreen values={values} set={set} err={err} />}
        {screen === "contact" && <ContactScreen values={values} set={set} err={err} />}
        {screen === "location" && <LocationScreen values={values} set={set} err={err} reference={reference} />}
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
            onEdit={(s) => go(s, true)}
            onBack={back}
            onServerErrors={(errs) => {
              go(screenForField(Object.keys(errs)[0] ?? "firstName"), true);
              setErrors(errs);
            }}
            onDone={finish}
          />
        )}
      </main>

      {screen !== "review" && (
        <FormFooter onBack={editing ? undefined : back}>
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
