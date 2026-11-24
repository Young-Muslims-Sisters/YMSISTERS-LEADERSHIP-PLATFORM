import "server-only";
import { env } from "./env";

export type Email = { to: string; subject: string; text: string };

// mailpit = local inbox, console = log only, smtp = not set up yet. Nothing calls this yet (see docs/SRC_EMAILS.md).
export async function sendEmail(email: Email): Promise<void> {
  switch (env.emailTransport) {
    case "mailpit":
      return sendViaMailpit(email);
    case "console":
      console.info(`[email] to=${email.to} subject=${JSON.stringify(email.subject)}\n${email.text}`);
      return;
    case "smtp":
      throw new Error("EMAIL_TRANSPORT=smtp is not configured yet. Choose and set up the provider before production.");
    default:
      throw new Error(`Unknown EMAIL_TRANSPORT ${String(env.emailTransport)}`);
  }
}

async function sendViaMailpit({ to, subject, text }: Email) {
  const from = parseAddress(env.emailFrom);
  const res = await fetch(`${env.mailpitUrl}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ From: from, To: [{ Email: to }], Subject: subject, Text: text }),
  });
  if (!res.ok) throw new Error(`Mailpit send failed: ${res.status}`);
}

function parseAddress(value: string): { Email: string; Name?: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return match ? { Name: match[1].replace(/^"|"$/g, ""), Email: match[2] } : { Email: value.trim() };
}
