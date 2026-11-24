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
  state: z.string().min(1, "Select your state"),
  location: locationSchema.nullable().refine((v) => v !== null, "Select your SR / Region"),
  neighborNetId: z.guid().nullable(),
});

export const involvementSchema = z.object({
  involvement: z.enum(["active_leadership", "cloud"]).nullable().refine((v) => v !== null, "Choose one option"),
});

export const currentPositionsSchema = z.object({
  currentPositions: z
    .array(z.object({ position: positionRefSchema.nullable().refine((v) => v !== null, "Choose a position or team") }))
    .min(1, "Add at least one current position")
    .max(10),
});

export const previousPositionsSchema = z.object({
  noPreviousPositions: z.boolean(),
  previousPositions: z
    .array(
      z
        .object({
          position: positionRefSchema.nullable(),
          fromYear: year.or(z.literal("")),
          toYear: year.or(z.literal("")),
        })
        .refine((p) => !p.fromYear || !p.toYear || Number(p.toYear) >= Number(p.fromYear), {
          message: "To Year must be the same as or after From Year",
          path: ["toYear"],
        }),
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
  organizations: z.array(tagValueSchema).max(20),
  anythingElse: z.string().trim().max(2000),
});

export const annualFormSchema = personalSchema
  .extend(contactSchema.shape)
  .extend(involvementSchema.shape)
  .extend({ currentPositions: z.array(z.object({ position: positionRefSchema.nullable() })).max(10) })
  .extend(previousPositionsSchema.shape)
  .extend(skillsSchema.shape)
  .extend(educationSchema.shape)
  .extend(connectionsSchema.shape)
  .superRefine((v, ctx) => {
    // Cloud skips the positions screen, so only Active needs one.
    if (v.involvement === "active_leadership" && !v.currentPositions.some((p) => p.position)) {
      ctx.addIssue({ code: "custom", path: ["currentPositions"], message: "Add at least one current position" });
    }
  });

export type AnnualFormValues = z.input<typeof annualFormSchema>;
export type ParsedAnnualForm = z.output<typeof annualFormSchema>;

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
  involvement: null,
  currentPositions: [{ position: null }],
  noPreviousPositions: false,
  previousPositions: [{ position: null, fromYear: "", toYear: "" }],
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
