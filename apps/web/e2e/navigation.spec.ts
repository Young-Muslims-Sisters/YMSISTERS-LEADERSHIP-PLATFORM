import { expect, test, type Page } from "@playwright/test";

// Nobody gets stuck: every page has a way back, and browser Back keeps answers.

const cont = (page: Page) => page.getByRole("button", { name: /^Continue/ }).click();
const heading = (page: Page, name: string) => expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
const onStart = (page: Page) => expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();

async function pick(page: Page, label: RegExp, text: string) {
  const box = page.getByRole("combobox", { name: label });
  await box.click();
  await box.fill(text);
  await page.getByRole("option", { name: text }).first().click();
  await page.keyboard.press("Escape");
}

async function fillPersonal(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByLabel(/First Name/).fill("Nav");
  await page.getByLabel(/Last Name/).fill("Test");
  await page.getByLabel(/Date of Birth/).fill("2003-05-01");
  await cont(page);
  await heading(page, "Contact Details");
}

test("browser Back and Forward move between form screens and keep answers", async ({ page }) => {
  await fillPersonal(page);
  await page.goBack();
  await heading(page, "Personal Information");
  await expect(page.getByLabel(/First Name/)).toHaveValue("Nav");
  await page.goForward();
  await heading(page, "Contact Details");
  await page.getByRole("button", { name: "Back" }).click();
  await heading(page, "Personal Information");
  await page.getByRole("button", { name: "Back" }).click();
  await onStart(page);
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByLabel(/First Name/)).toHaveValue("Nav");
});

test("the glossary returns to the form with answers kept", async ({ page }) => {
  await fillPersonal(page);
  await page.getByLabel(/Personal Email/).fill("nav@example.test");
  await page.getByLabel(/Phone/).fill("(555) 555-0123");
  await page.getByText("No, I need one").click();
  await cont(page);
  await pick(page, /^State \(required/, "Washington");
  await pick(page, /Subregion/, "New Jersey Central");
  await cont(page);
  await heading(page, "YM Involvement");
  await page.getByRole("button", { name: "What is Cloud?" }).click();
  const [glossary] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("link", { name: /View full glossary/ }).click(),
  ]);
  await heading(glossary, "YM Glossary");
  await Promise.all([
    glossary.waitForEvent("close"),
    glossary.getByRole("link", { name: "Back to the form" }).first().click(),
  ]);
  await heading(page, "YM Involvement");
});

test("a direct glossary link and unknown pages lead back", async ({ page }) => {
  await page.goto("/");
  await page.goto("/glossary");
  await page.getByRole("link", { name: "Back to the form" }).first().click();
  await onStart(page);
  await page.goto("/no-such-page");
  await heading(page, "Page not found");
  await page.getByRole("link", { name: "Back to start" }).click();
  await onStart(page);
});

test("the thank-you screen leads back to an empty start", async ({ page }) => {
  await fillPersonal(page);
  await page.getByLabel(/Personal Email/).fill(`e2e-nav-${test.info().project.name}-${Date.now()}@example.test`);
  await page.getByLabel(/Phone/).fill("(555) 555-0123");
  await page.getByText("No, I need one").click();
  await cont(page);
  await pick(page, /^State \(required/, "Washington");
  await pick(page, /Subregion/, "New Jersey Central");
  await cont(page);
  await page.getByText("Interested in Cloud", { exact: true }).click();
  await cont(page);
  await heading(page, "Leadership History");
  await page.getByRole("checkbox").first().check();
  for (const name of ["Skills & Contributions", "Education & Background", "Background & Connections", "Review Your Information"]) {
    await cont(page);
    await heading(page, name);
  }
  // Back leaves an edit and returns to review.
  await page.getByRole("button", { name: "Edit Contact Details" }).click();
  await heading(page, "Contact Details");
  await page.goBack();
  await heading(page, "Review Your Information");
  await page.getByRole("button", { name: /Submit Form/ }).click();
  await expect(page.getByRole("heading", { name: /has been submitted/ })).toBeVisible();
  // Forward cannot reopen the submitted form.
  await page.waitForTimeout(500);
  await page.goForward();
  await expect(page.getByRole("heading", { name: /has been submitted/ })).toBeVisible();
  await page.getByRole("button", { name: "Back to start" }).click();
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByLabel(/First Name/)).toHaveValue("");
});

test("the directory leads back, and Back closes an open profile", async ({ page }) => {
  await page.goto("/directory");
  await page.getByRole("button", { name: "Test member" }).click();
  await heading(page, "Leadership Directory");
  await page.getByRole("button", { name: "Amira Example" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(200); // The history entry is added just after opening.
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/directory");
  await page.getByRole("button", { name: "Amira Example" }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL("/directory");
  await page.getByRole("link", { name: "Form", exact: true }).click();
  await onStart(page);
});
