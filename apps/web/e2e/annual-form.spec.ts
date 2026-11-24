import { expect, test, type Page } from "@playwright/test";

// Walks through the public form on the local database.

process.loadEnvFile(".env.development.local");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SHOTS = process.env.E2E_SCREENSHOT_DIR; // optional: save a screenshot per screen

if (!SUPABASE_URL.includes("127.0.0.1") && !SUPABASE_URL.includes("localhost")) {
  throw new Error("E2E tests must run against the local Supabase stack");
}

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function pick(page: Page, label: string | RegExp, text: string, option?: string | RegExp) {
  const box = page.getByRole("combobox", { name: label });
  await box.click();
  await box.fill(text);
  await page.getByRole("option", { name: option ?? text }).first().click();
  await page.keyboard.press("Escape"); // Multi-selects stay open until dismissed.
}

async function pickYear(page: Page, label: string, year: string) {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("dialog").getByRole("button", { name: year, exact: true }).click();
}

async function db<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return (await res.json()) as T;
}

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Get Started" }).click();
}

const cont = (page: Page) => page.getByRole("button", { name: /^Continue/ }).click();

test("required fields are enforced before moving on", async ({ page }) => {
  await start(page);
  await cont(page);
  await expect(page.getByText("Enter your first name")).toBeVisible();
  await expect(page.getByText("Enter your date of birth")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personal Information" })).toBeVisible();
  await expect(page.getByLabel(/First Name/)).toBeFocused();
});

test("active leader completes the form and lands in the directory", async ({ page }) => {
  const email = `e2e-${test.info().project.name}-${Date.now()}@example.test`;
  await start(page);

  // 1. Personal
  await shot(page, "01-personal");
  await page.getByLabel(/First Name/).fill("Test");
  await page.getByLabel(/Last Name/).fill("Walkthrough");
  await page.getByLabel(/Date of Birth/).fill("2003-05-01");
  await pick(page, "Ethnicity", "Pakis", "Pakistani");
  await cont(page);

  // 2. Contact
  await expect(page.getByRole("heading", { name: "Contact Details" })).toBeVisible();
  await page.getByLabel(/Personal Email Address/).fill(email);
  await page.getByLabel(/Phone Number/).fill("(555) 555-0123");
  await pick(page, /^State/, "Wash", "Washington");
  await page.getByRole("combobox", { name: /NeighborNet/ }).click();
  await expect(page.getByText("Please select your SR / Region first")).toBeVisible();
  await expect(page.getByRole("combobox", { name: /Subregion \(SR\)/ })).toBeFocused();
  await pick(page, /Subregion \(SR\)/, "NJC");
  await pick(page, /NeighborNet/, "Edison");
  await shot(page, "02-contact");
  await cont(page);

  // 3. Involvement
  await page.getByText("Active Leadership", { exact: true }).click();
  await page.getByRole("button", { name: "What is Cloud?" }).click();
  await expect(page.getByRole("dialog", { name: "What is Cloud?" })).toBeVisible();
  const [glossary] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: /View full glossary/ }).click(),
  ]);
  await expect(glossary.getByRole("heading", { name: "YM Glossary" })).toBeVisible();
  await expect(glossary.getByText("NeighborNet Coordinator")).toBeVisible();
  await shot(glossary, "03b-glossary");
  await glossary.close();
  await page.keyboard.press("Escape");
  await shot(page, "03-involvement");
  await cont(page);

  // 3a. Current positions
  await expect(page.getByRole("heading", { name: "Current Leadership" })).toBeVisible();
  await pick(page, /Position \/ Team/, "Subregional", /Subregional Coordinator/);
  await shot(page, "04-current");
  await cont(page);

  // 3b. Previous positions
  await expect(page.getByRole("heading", { name: "Leadership History" })).toBeVisible();
  await pick(page, /^Position$/, "NeighborNet Coordinator", /NeighborNet Coordinator/);
  await pickYear(page, "From Year", "2023");
  await pickYear(page, "To Year", "2025");
  await shot(page, "05-previous");
  await cont(page);

  // 4. Skills
  await pick(page, "Skills", "Graphic", "Graphic Design");
  await pick(page, "Skills", "Henna Art", /Add “Henna Art”/);
  await pick(page, "YM Interests", "YMC", "Conferences (YMC)");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Remove Henna Art" })).toBeVisible();
  await shot(page, "06-skills");
  await cont(page);

  // 5. Education
  await page.getByRole("button", { name: "Undergraduate" }).click();
  await pick(page, "School / University", "Princeton", "Princeton University");
  await pick(page, "Field(s) of Study", "Computer", "Computer Science");
  await pick(page, "Occupation", "Doula", /Add “Doula”/);
  await shot(page, "07-education");
  await cont(page);

  // 5b. Connections
  await pick(page, "Organizations", "MSA", "MSA");
  await page.getByLabel(/Anything else/).fill("Fictional end-to-end test entry.");
  await shot(page, "08-connections");
  await cont(page);

  // Review
  await expect(page.getByRole("heading", { name: "Review Your Information", exact: true })).toBeVisible();
  await expect(page.getByText(/Subregional Coordinator/)).toBeVisible();
  await shot(page, "09-review");

  // Editing from review returns straight to review.
  await page.getByRole("button", { name: "Edit Contact Details" }).click();
  await page.getByLabel(/Phone Number/).fill("(555) 555-0177");
  await page.getByRole("button", { name: "Save & Return to Review" }).click();
  await expect(page.getByText(/555-0177/)).toBeVisible();

  await page.getByRole("button", { name: /Submit Form/ }).click();
  await expect(page.getByRole("heading", { name: /has been submitted/ })).toBeVisible({ timeout: 20_000 });
  await shot(page, "11-done");

  // Database: profile, submission, roles, tags and the queued SRC email.
  const users = await db<{ id: string; involvement: string; phone: string }[]>(
    `users?email=eq.${encodeURIComponent(email)}&select=id,involvement,phone`,
  );
  expect(users).toHaveLength(1);
  expect(users[0].involvement).toBe("active_leadership");
  const subs = await db<{ id: string; answers: { birthday: string } }[]>(
    `annual_submissions?user_id=eq.${users[0].id}&select=id,answers`,
  );
  expect(subs).toHaveLength(1);
  expect(subs[0].answers.birthday).toBe("2003-05-01");
  const roles = await db<{ is_current: boolean; from_year: number | null }[]>(
    `role_assignments?user_id=eq.${users[0].id}&select=is_current,from_year`,
  );
  expect(roles.filter((r) => r.is_current)).toHaveLength(1);
  expect(roles.find((r) => !r.is_current)?.from_year).toBe(2023);
  const deliveries = await db<{ status: string; recipient_email: string }[]>(
    `notification_deliveries?submission_id=eq.${subs[0].id}&select=status,recipient_email`,
  );
  expect(deliveries).toEqual([{ status: "queued", recipient_email: "src-njc@example.test" }]);
  const pending = await db<{ label: string; is_approved: boolean }[]>(
    `profile_tags?label=in.(Henna%20Art,Doula)&select=label,is_approved`,
  );
  expect(pending.every((t) => t.is_approved === false)).toBe(true);
});

test("Cloud path skips current positions", async ({ page }) => {
  const email = `e2e-cloud-${test.info().project.name}-${Date.now()}@example.test`;
  await start(page);
  await page.getByLabel(/First Name/).fill("Cloud");
  await page.getByLabel(/Last Name/).fill("Walkthrough");
  await page.getByLabel(/Date of Birth/).fill("2001-01-01");
  await cont(page);
  await page.getByLabel(/Personal Email Address/).fill(email);
  await page.getByLabel(/Phone Number/).fill("5555550199");
  await pick(page, /^State/, "Tex", "Texas");
  await pick(page, /Subregion \(SR\)/, "West");
  await pick(page, /NeighborNet/, "Bothell");
  await cont(page);
  await page.getByText("Interested in Cloud", { exact: true }).click();
  await cont(page);
  await expect(page.getByRole("heading", { name: "Leadership History" })).toBeVisible();
  await page.getByLabel(/I have not previously held/).check();
  await cont(page);
  await expect(page.getByRole("heading", { name: "Skills & Contributions", exact: true })).toBeVisible();
  await cont(page);
  await expect(page.getByRole("heading", { name: "Education & Background", exact: true })).toBeVisible();
  await cont(page);
  await expect(page.getByRole("heading", { name: "Background & Connections", exact: true })).toBeVisible();
  await cont(page);
  await expect(page.getByRole("heading", { name: "Review Your Information", exact: true })).toBeVisible();
  await expect(page.getByText(/Interested in Cloud/)).toBeVisible();
  await page.getByRole("button", { name: /Submit Form/ }).click();
  await expect(page.getByRole("heading", { name: /has been submitted/ })).toBeVisible({ timeout: 20_000 });

  const users = await db<{ id: string; involvement: string }[]>(`users?email=eq.${encodeURIComponent(email)}&select=id,involvement`);
  expect(users[0].involvement).toBe("cloud");
  const subs = await db<{ id: string }[]>(`annual_submissions?user_id=eq.${users[0].id}&select=id`);
  const deliveries = await db<{ status: string }[]>(`notification_deliveries?submission_id=eq.${subs[0].id}&select=status`);
  expect(deliveries[0].status).toBe("no_route"); // region-only answer: no SRC group
});

test("an existing profile cannot be changed without the matching date of birth", async ({ page }) => {
  const email = `e2e-dob-${test.info().project.name}-${Date.now()}@example.test`;
  const submit = async (birthday: string, phone: string) => {
    await start(page);
    await page.getByLabel(/First Name/).fill("Dob");
    await page.getByLabel(/Last Name/).fill("Check");
    await page.getByLabel(/Date of Birth/).fill(birthday);
    await cont(page);
    await page.getByLabel(/Personal Email Address/).fill(email);
    await page.getByLabel(/Phone Number/).fill(phone);
    await pick(page, /^State/, "Tex", "Texas");
    await pick(page, /Subregion \(SR\)/, "West");
    await cont(page);
    await page.getByText("Interested in Cloud", { exact: true }).click();
    await cont(page);
    await page.getByLabel(/I have not previously held/).check();
    for (let i = 0; i < 4; i++) await cont(page);
    await page.getByRole("button", { name: /Submit Form/ }).click();
  };
  const phones = () => db<{ phone: string }[]>(`users?email=eq.${encodeURIComponent(email)}&select=phone`);
  const done = page.getByRole("heading", { name: /has been submitted/ });

  await submit("2000-01-01", "5555550101");
  await expect(done).toBeVisible({ timeout: 20_000 });

  await submit("2000-01-02", "5555550102");
  await expect(page.getByText(/different date of birth/)).toBeVisible({ timeout: 20_000 });
  expect(await phones()).toEqual([{ phone: "5555550101" }]);

  await submit("2000-01-01", "5555550103");
  await expect(done).toBeVisible({ timeout: 20_000 });
  expect(await phones()).toEqual([{ phone: "5555550103" }]);
});
