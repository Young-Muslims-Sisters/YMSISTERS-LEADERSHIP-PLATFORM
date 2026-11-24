import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name} (see apps/web/.env.example)`);
  return value;
}

// Server configuration. Read lazily so a missing value fails the request, not the build.
export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get serviceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get publishableKey() {
    return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
  get cycleYear() {
    const year = Number(process.env.FORM_CYCLE_YEAR ?? "2027");
    if (!Number.isInteger(year) || year < 2027) throw new Error("FORM_CYCLE_YEAR must be a year >= 2027");
    return year;
  },
  get emailTransport() {
    return (process.env.EMAIL_TRANSPORT ?? "console") as "console" | "mailpit" | "smtp";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "YM Sisters Leadership <no-reply@example.org>";
  },
  get mailpitUrl() {
    return process.env.MAILPIT_URL ?? "http://127.0.0.1:54424";
  },
};
