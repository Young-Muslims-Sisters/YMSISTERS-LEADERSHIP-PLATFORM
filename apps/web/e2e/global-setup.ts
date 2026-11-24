import type { FullConfig } from "@playwright/test";

// These tests submit forms, so refuse to run against the hosted database.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const html = await (await fetch(`${baseURL}/login`)).text();
  if (!html.includes("Local testing only")) {
    throw new Error(`${baseURL} is not a local development server. Stop it (it may be using the hosted database), then rerun.`);
  }
}
