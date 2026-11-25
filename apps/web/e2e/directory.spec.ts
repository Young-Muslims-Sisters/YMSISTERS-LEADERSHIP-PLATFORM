import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

// Login, directory and IT dashboard against the LOCAL stack, using the fictional seed people.

process.loadEnvFile(".env.development.local");
if (!/127\.0\.0\.1|localhost/.test(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
  throw new Error("E2E tests must run against the local Supabase stack");
}
const SHOTS = process.env.E2E_SCREENSHOT_DIR;

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${name}.png` });
}

async function signIn(page: Page, account: "Test member" | "Test IT admin", path: "/directory" | "/admin") {
  await page.goto(path);
  await page.getByRole("button", { name: account }).click();
  await expect(page).toHaveURL(path);
  // The development badge can cover content on small screens.
  await page.addStyleTag({ content: "nextjs-portal { display: none }" });
}

test("signed-out visitors are sent to login", async ({ page }) => {
  for (const path of ["/directory", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(`/login?next=${path}`);
  }
  await expect(page.getByRole("button", { name: "Sign in with YM email" })).toBeVisible();
  await shot(page, "20-login");
  await page.getByRole("button", { name: "Sign in with YM email" }).click();
  await expect(page.getByText("Google sign-in only works on the live site")).toBeVisible();
});

test("the form links to the directory", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Go to Leadership Directory" }).click();
  await expect(page).toHaveURL(/\/login\?next=(\/|%2F)directory/);
});

test("member searches, filters, opens a profile and exports", async ({ page }) => {
  await signIn(page, "Test member", "/directory");
  await expect(page.getByRole("heading", { name: "Leadership Directory" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IT Dashboard" })).toHaveCount(0);
  await shot(page, "21-directory");

  // Filters: groups narrow results, and chips remove them again.
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("combobox", { name: "Skills" }).fill("Video");
  await page.getByRole("option", { name: "Video Editing" }).click();
  await page.keyboard.press("Escape");
  await shot(page, "22-filter");
  await page.getByRole("button", { name: "Show results" }).click();
  await expect(page.getByText("Skills: Video Editing")).toBeVisible();
  await expect(page.getByRole("button", { name: "Amira Example" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bushra Sample" })).toHaveCount(0);
  await page.getByRole("button", { name: "Remove Skills filter" }).click();
  await expect(page.getByRole("button", { name: "Bushra Sample" })).toBeVisible();

  // Filter lists match the form: every NeighborNet, narrowed by SR / Region.
  await page.getByRole("button", { name: "Filter" }).click();
  await page.getByRole("combobox", { name: /NeighborNet/ }).fill("Salisbury");
  await expect(page.getByRole("option", { name: "Salisbury" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: /SR/ }).fill("NJC");
  await page.getByRole("option", { name: "NJC" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: /NeighborNet/ }).click();
  await expect(page.getByRole("option")).toHaveCount(10);
  await shot(page, "22b-nn");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Close" }).click();

  // 50 people per page.
  const rows = page.locator("tbody tr");
  if ((await page.getByRole("navigation", { name: "Pages" }).count()) > 0) {
    await expect(rows).toHaveCount(50);
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText(/Showing 51–/)).toBeVisible();
  }

  // Search and profile. Private answers never reach the browser.
  await page.getByRole("searchbox").fill("amira");
  await expect(page.getByRole("heading", { name: "1 contact found" })).toBeVisible();
  await page.getByRole("button", { name: "Amira Example" }).click();
  const profile = page.getByRole("dialog", { name: "Leadership Profile" });
  await expect(profile.getByText("Subregional Coordinator (SRC)")).toBeVisible();
  await expect(profile.getByRole("link", { name: "amira@example.test" })).toHaveAttribute("href", "mailto:amira@example.test");
  await shot(page, "23-profile");
  expect(await page.content()).not.toMatch(/2003-04-12|Pakistani/);
  await page.keyboard.press("Escape");
  await expect(profile).toHaveCount(0);

  // Export
  await page.getByRole("button", { name: "Export" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await readFile((await (await download).path())!, "utf8");
  expect(csv).toContain("amira@example.test");
  expect(csv).not.toMatch(/bushra|2003-04-12|Pakistani/i);

  // Members cannot open the IT dashboard, and signing out ends access.
  await page.goto("/admin");
  await expect(page).toHaveURL("/directory");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/directory");
  await expect(page).toHaveURL(/\/login/);
});

test("IT admin sees responses, private answers and email status", async ({ page }) => {
  await signIn(page, "Test IT admin", "/admin");
  await expect(page.getByRole("heading", { name: "IT Dashboard" })).toBeVisible();
  // The guide opens on the first visit, then only from the "?" button.
  const guide = page.getByRole("dialog", { name: "What you can do here" });
  await expect(guide).toBeVisible();
  await shot(page, "24a-guide");
  await page.getByRole("button", { name: "Got it" }).click();
  await page.reload();
  await page.addStyleTag({ content: "nextjs-portal { display: none }" });
  await expect(page.getByRole("heading", { name: "IT Dashboard" })).toBeVisible();
  await expect(guide).toHaveCount(0);
  await page.getByRole("button", { name: "What can I do here?" }).click();
  await expect(guide).toBeVisible();
  await page.keyboard.press("Escape");
  await shot(page, "24-admin");
  await page.getByRole("searchbox").fill("amira");
  await expect(page.getByText("Queued")).toBeVisible();
  await page.getByRole("button", { name: "Amira Example" }).click();
  const response = page.getByRole("dialog", { name: "Amira Example" });
  await expect(response.getByText("2003-04-12")).toBeVisible();
  await expect(response.getByText("src-njc@example.test")).toBeVisible();
  await shot(page, "25-response");
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("dalia");
  await expect(page.getByText("No route")).toBeVisible();
});

test("IT admin deletes a person only after confirming", async ({ page }) => {
  // A throwaway fictional person, so the seed people stay.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const last = `${test.info().project.name}${Date.now()}`;
  const email = `e2e-delete-${last}@example.test`;
  const [region] = await (await fetch(`${url}/rest/v1/subregions?select=id,region_id&code=eq.NJC`, { headers })).json();
  const created = await fetch(`${url}/rest/v1/rpc/submit_annual_form`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      payload: {
        cycle_year: 2027, first_name: "Delete", last_name: last, email, phone: "(555) 555-0123", state: "New Jersey",
        region_id: region.region_id, subregion_id: region.id, involvement: "cloud",
        current_positions: [], previous_positions: [], tags: [], answers: { birthday: "2003-05-01" },
      },
    }),
  });
  expect(created.ok, await created.text()).toBe(true);

  await signIn(page, "Test IT admin", "/admin");
  await page.getByRole("button", { name: "Got it" }).click();
  await page.getByRole("searchbox").fill(last);
  await page.getByRole("button", { name: `Delete ${last}` }).click();
  await page.getByRole("button", { name: "Delete this person" }).click();
  await shot(page, "26-delete");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Delete this person" }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("No responses match.")).toBeVisible();
  const left = await (await fetch(`${url}/rest/v1/users?select=id&email=eq.${email}`, { headers })).json();
  expect(left).toEqual([]);
});
