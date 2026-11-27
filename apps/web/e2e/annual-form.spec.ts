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
  const box = page.getByRole("combobox", { name: label }).last(); // the newest row when there are several
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
  // YM email is required, and must be a YM address.
  await cont(page);
  await expect(page.getByText("Choose one option")).toBeVisible();
  await page.getByText("No, I need one").click();
  await expect(page.getByText(/You need one to view the Leadership Directory/)).toBeVisible();
  await page.getByText("Yes, I have one").click();
  await page.getByLabel(/YM Email Address/).fill("walkthrough@gmail.com");
  await cont(page);
  await expect(page.getByText(/Enter your YM email/)).toBeVisible();
  await page.getByLabel(/YM Email Address/).fill("walkthrough@ymsisters.com");
  await shot(page, "02-contact");
  await cont(page);

  // 2b. Location
  await expect(page.getByRole("heading", { name: "Your Location" })).toBeVisible();
  await pick(page, /^State \(required/, "Wash", "Washington");
  await page.getByRole("combobox", { name: /NeighborNet/ }).click();
  await expect(page.getByText("Please select your SR / Region first")).toBeVisible();
  await expect(page.getByRole("combobox", { name: /Subregion \(SR\)/ })).toBeFocused();
  await pick(page, /Subregion \(SR\)/, "New Jersey Central");
  await pick(page, /NeighborNet/, "Edison");
  // The address is optional, but a ZIP code must look like one.
  await page.getByLabel(/Street Address/).fill("1 Example Way");
  await page.getByLabel(/ZIP Code/).fill("88");
  await cont(page);
  await expect(page.getByText("Enter a 5-digit ZIP code")).toBeVisible();
  await page.getByLabel(/^City/).fill("Edison");
  await pick(page, /^State$/, "New J", "New Jersey");
  await page.getByLabel(/ZIP Code/).fill("08817");
  await shot(page, "02b-location");
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
  // A shura role needs a portfolio; a team needs the position on it.
  await page.getByRole("button", { name: "+ Add Another Position" }).click();
  await pick(page, /Position \/ Team/, "SubRegional Shura", /SubRegional Shura/);
  await page.getByRole("button", { name: "+ Add Another Position" }).click();
  await pick(page, /Position \/ Team/, "Conferences", /Conferences \(YMC\)/);
  await cont(page);
  await expect(page.getByText("Choose your portfolio")).toBeVisible();
  await expect(page.getByText("Choose your position on the team")).toBeVisible();
  await pick(page, /^Portfolio/, "Tarbiyyah", "Tarbiyyah");
  await pick(page, /Your position on the team/, "Lead", "Lead");
  await page.getByLabel(/What do you lead/).fill("Logistics");
  await shot(page, "04-current");
  await cont(page);

  // 3b. Previous positions
  await expect(page.getByRole("heading", { name: "Leadership History" })).toBeVisible();
  await pick(page, /^Position$/, "NeighborNet Coordinator", /NeighborNet Coordinator/);
  await pickYear(page, "From Year", "2023");
  await pickYear(page, "To Year", "2025");
  await page.getByLabel(/What did you do in this role/).fill("Started a monthly halaqa.");
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
  await pick(page, "Organization", "MSA", "MSA");
  await page.getByLabel("Your role").fill("President");
  await page.getByLabel(/How were you involved/).fill("Ran weekly halaqas.");
  await page.getByLabel(/Anything else/).fill("Fictional end-to-end test entry.");
  await shot(page, "08-connections");
  await cont(page);

  // Review
  await expect(page.getByRole("heading", { name: "Review Your Information", exact: true })).toBeVisible();
  await expect(page.getByText(/SubRegional Shura · Tarbiyyah/)).toBeVisible();
  await expect(page.getByText(/Conferences \(YMC\) · Logistics Lead/)).toBeVisible();
  await expect(page.getByText(/MSA \(President\)/)).toBeVisible();
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
  expect(roles.filter((r) => r.is_current)).toHaveLength(3);
  const team = await db<{ team_title: string; title_detail: string }[]>(
    `role_assignments?user_id=eq.${users[0].id}&team_id=not.is.null&select=team_title,title_detail`,
  );
  expect(team).toEqual([{ team_title: "lead", title_detail: "Logistics" }]);
  const details = await db<{ ym_email: string; postal_code: string }[]>(
    `user_private_details?user_id=eq.${users[0].id}&select=ym_email,postal_code`,
  );
  expect(details).toEqual([{ ym_email: "walkthrough@ymsisters.com", postal_code: "08817" }]);
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
  await page.getByText("No, I need one").click();
  await cont(page);
  await pick(page, /^State \(required/, "Tex", "Texas");
  await pick(page, /Subregion \(SR\)/, "West", /^West$/);
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
    await page.getByText("No, I need one").click();
    await cont(page);
    await pick(page, /^State \(required/, "Tex", "Texas");
    await pick(page, /Subregion \(SR\)/, "West", /^West$/);
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
