import { z } from "zod";

// Used by the browser for hints and by the server for real validation.

// A searchable-list answer: an existing option (id) or a typed-in entry (label only).
export const tagValueSchema = z.object({
  id: z.guid().optional(),
  label: z.string().trim().min(1).max(100),
});
export type TagValue = z.infer<typeof tagValueSchema>;

// Position dropdown value: "role:<uuid>" or "team:<uuid>".
export const positionRefSchema = z.string().regex(/^(role|team):[0-9a-f-]{36}$/i, "Choose a position or team");

export const locationSchema = z.object({
  kind: z.enum(["region", "subregion"]),
  id: z.guid(),
});

// Position on a national team. Lead and Other also need text (what they lead, or the title).
export const TEAM_TITLES = { chair: "Chair", co_chair: "Co-Chair", lead: "Lead", member: "Member", other: "Other" } as const;
export type TeamTitle = keyof typeof TEAM_TITLES;
const teamTitleSchema = z.enum(Object.keys(TEAM_TITLES) as [TeamTitle, ...TeamTitle[]]);

// A position plus its details: a shura portfolio, or a position on a team.
const positionFields = {
  position: positionRefSchema.nullable(),
  portfolio: tagValueSchema.nullable(),
  teamTitle: teamTitleSchema.nullable(),
  titleDetail: z.string().trim().max(100),
};
type PositionDetails = { position: string | null; teamTitle: TeamTitle | null; titleDetail: string };

// Rules that need no reference data. A team needs a position on it when `teamRequired`.
function checkDetails(p: PositionDetails, ctx: z.RefinementCtx, teamRequired: boolean) {
  if (teamRequired && p.position?.startsWith("team:") && !p.teamTitle) {
    ctx.addIssue({ code: "custom", path: ["teamTitle"], message: "Choose your position on the team" });
  }
  if (p.teamTitle === "lead" && !p.titleDetail.trim()) {
    ctx.addIssue({ code: "custom", path: ["titleDetail"], message: "Say what you lead, e.g. Logistics" });
  }
  if (p.teamTitle === "other" && !p.titleDetail.trim()) {
    ctx.addIssue({ code: "custom", path: ["titleDetail"], message: "Enter your title" });
  }
}

const currentPosition = z.object(positionFields).superRefine((p, ctx) => checkDetails(p, ctx, true));

export const YM_EMAIL_DOMAIN = "ymsisters.com";
const ymEmailPattern = new RegExp(`^[^@\\s]+@${YM_EMAIL_DOMAIN.replace(".", "\\.")}$`, "i");

const year = z
  .string()
  .trim()
  .regex(/^(19[5-9]\d|20\d\d)$/, "Use a 4-digit year");

export const personalSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(80),
  lastName: z.string().trim().min(1, "Enter your last name").max(80),
  birthday: z.iso.date("Enter your date of birth"),
  ethnicity: z.array(tagValueSchema).max(10),
});

export const contactSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase().max(254),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number")
    .refine((v) => v.length <= 30, "Enter a valid phone number"),
  ymEmailStatus: z.enum(["has", "needs"]).nullable().refine((v) => v !== null, "Choose one option"),
  ymEmail: z.string().trim().toLowerCase().max(254),
}).superRefine((v, ctx) => {
  if (v.ymEmailStatus === "has" && !ymEmailPattern.test(v.ymEmail)) {
    ctx.addIssue({ code: "custom", path: ["ymEmail"], message: `Enter your YM email, ending in @${YM_EMAIL_DOMAIN}` });
  }
});

// Where the person is in YM, and an optional mailing address.
export const placeSchema = z.object({
  state: z.string().min(1, "Select your state"),
  location: locationSchema.nullable().refine((v) => v !== null, "Select your SR / Region"),
  neighborNetId: z.guid().nullable(),
  addressLine1: z.string().trim().max(200),
  addressLine2: z.string().trim().max(200),
  city: z.string().trim().max(100),
  addressState: z.string().max(100),
  postalCode: z.string().trim().refine((v) => !v || /^\d{5}(-\d{4})?$/.test(v), "Enter a 5-digit ZIP code"),
});


export const involvementSchema = z.object({
  involvement: z.enum(["active_leadership", "cloud"]).nullable().refine((v) => v !== null, "Choose one option"),
});

export const currentPositionsSchema = z.object({
  currentPositions: z
    .array(currentPosition.refine((p) => p.position !== null, { message: "Choose a position or team", path: ["position"] }))
    .min(1, "Add at least one current position")
    .max(10),
});

export const previousPositionsSchema = z.object({
  noPreviousPositions: z.boolean(),
  previousPositions: z
    .array(
      z
        .object({
          ...positionFields,
          description: z.string().trim().max(1000),
          fromYear: year.or(z.literal("")),
          toYear: year.or(z.literal("")),
        })
        .refine((p) => !p.fromYear || !p.toYear || Number(p.toYear) >= Number(p.fromYear), {
          message: "To Year must be the same as or after From Year",
          path: ["toYear"],
        })
        .superRefine((p, ctx) => checkDetails(p, ctx, false)),
    )
    .max(20),
});

export const skillsSchema = z.object({
  skills: z.array(tagValueSchema).max(30),
  interests: z.array(tagValueSchema).max(30),
});

export const educationSchema = z.object({
  educationStatus: z.array(z.string()).max(7),
  schools: z.array(tagValueSchema).max(10),
  fieldsOfStudy: z.array(tagValueSchema).max(10),
  occupation: tagValueSchema.nullable(),
});

export const connectionsSchema = z.object({
  organizations: z
    .array(z.object({ org: tagValueSchema, role: z.string().trim().max(100), details: z.string().trim().max(1000) }))
    .max(20),
  anythingElse: z.string().trim().max(2000),
});

export const annualFormSchema = personalSchema
  .extend(contactSchema.shape)
  .extend(placeSchema.shape)
  .extend(involvementSchema.shape)
  .extend({ currentPositions: z.array(currentPosition).max(10) })
  .extend(previousPositionsSchema.shape)
  .extend(skillsSchema.shape)
  .extend(educationSchema.shape)
  .extend(connectionsSchema.shape)
  .superRefine((v, ctx) => {
    if (v.ymEmailStatus === "has" && !ymEmailPattern.test(v.ymEmail)) {
      ctx.addIssue({ code: "custom", path: ["ymEmail"], message: `Enter your YM email, ending in @${YM_EMAIL_DOMAIN}` });
    }
    // Cloud skips the positions screen, so only Active needs one.
    if (v.involvement === "active_leadership" && !v.currentPositions.some((p) => p.position)) {
      ctx.addIssue({ code: "custom", path: ["currentPositions"], message: "Add at least one current position" });
    }
  });

export type AnnualFormValues = z.input<typeof annualFormSchema>;
export type ParsedAnnualForm = z.output<typeof annualFormSchema>;

export const EMPTY_POSITION = { position: null, portfolio: null, teamTitle: null, titleDetail: "" };

export const emptyForm: AnnualFormValues = {
  firstName: "",
  lastName: "",
  birthday: "",
  ethnicity: [],
  email: "",
  phone: "",
  state: "",
  location: null,
  neighborNetId: null,
  ymEmailStatus: null,
  ymEmail: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  addressState: "",
  postalCode: "",
  involvement: null,
  currentPositions: [EMPTY_POSITION],
  noPreviousPositions: false,
  previousPositions: [{ ...EMPTY_POSITION, description: "", fromYear: "", toYear: "" }],
  skills: [],
  interests: [],
  educationStatus: [],
  schools: [],
  fieldsOfStudy: [],
  occupation: null,
  organizations: [],
  anythingElse: "",
};

// Turn a Zod error into { "field.path": "message" } for inline display.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
    // Show nested problems on their parent field, so no error is hidden.
    const root = String(issue.path[0] ?? "");
    if (root && !out[root] && !/^\d+$/.test(String(issue.path[1] ?? ""))) out[root] = issue.message;
  }
  return out;
}
