import type { Position } from "@/lib/directory/types";

export type EmailStatus = "queued" | "sending" | "sent" | "failed" | "no_route";

// One accepted submission, including sensitive answers. IT only.
export type Response = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  location: string | null;
  neighborNet: string | null;
  involvement: "Active" | "Cloud";
  revision: number;
  submittedAt: string;
  possibleDuplicate: boolean;
  current: Position[];
  previous: Position[];
  emailStatus: EmailStatus;
  emailRecipient: string | null;
  emailError: string | null;
  birthday: string | null;
  ethnicity: string[];
  educationStatus: string[];
  skills: string[];
  interests: string[];
  schools: string[];
  fieldsOfStudy: string[];
  occupation: string | null;
  organizations: string[];
  ymEmail: string | null;
  // Said they need a YM email created.
  needsYmEmail: boolean;
  address: string | null;
  anythingElse: string | null;
};
