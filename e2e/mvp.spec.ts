import { test, expect } from "@playwright/test";
import { config } from "../src/lib/config";
const title = "SYNTHETIC browser review " + Date.now();
test("reader navigation, mobile layout and draft privacy", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Keep up. Without the noise." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "AI", exact: true }).first().click();
  await expect(
    page.getByRole("heading", { name: "AI", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/subscribe");
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const denied = await request.post("/api/action", {
    headers: { origin: config().APP_URL },
    data: { action: "tick" },
  });
  expect(denied.status()).toBe(401);
  const cross = await request.post("/api/action", {
    headers: { origin: "https://untrusted.invalid" },
    data: { action: "login", password: "wrong" },
  });
  expect(cross.status()).toBe(403);
});
test("editor creates, releases, reviews and publishes a story", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Editor password").fill(config().ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Open the editorial desk" }).click();
  await expect(
    page.getByRole("heading", { name: "Your review queue" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add a candidate +" }).click();
  await page.getByLabel("Headline", { exact: true }).fill(title);
  await page
    .getByLabel("Original source URL")
    .fill("https://example.invalid/browser-fixture");
  await page
    .getByLabel("Evidence notes and supported claims")
    .fill("Synthetic source evidence, authored for the browser test only.");
  await page.getByLabel("Public evidence label").fill("Fictional browser test");
  await page
    .getByLabel("What happened and why it matters")
    .fill(
      "A fictional change used to test the complete editor workflow, with no real news claim.",
    );
  await page.getByLabel("Fictional demonstration, label publicly").check();
  await page
    .getByLabel("What changed", { exact: true })
    .fill("A synthetic product changes only for the purposes of this test.");
  await page
    .getByLabel("Availability and affected audience")
    .fill("Only local testers are affected by this fictional example.");
  await page
    .getByLabel("Why it matters", { exact: true })
    .fill("This demonstrates the app review and publication sequence.");
  await page
    .getByLabel("Limitations and unknowns")
    .fill(
      "There is no real announcement or external source behind this example.",
    );
  await page
    .getByRole("button", { name: "Create candidate", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Approve and release brief" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve and release brief" }).click();
  await expect(
    page.getByRole("button", { name: "Submit article for review" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit article for review" }).click();
  await expect(
    page.getByRole("button", { name: "Approve and publish article" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Approve and publish article" })
    .click();
  await expect(
    page.getByRole("button", { name: "Publish recorded correction" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(page).toHaveURL(/\/articles\//);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Demonstration", { exact: true })).toBeVisible();
});
test("subscriber selects topics, connects local Telegram and pauses it", async ({
  page,
}) => {
  await page.goto("/subscribe");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create Telegram connection" })
    .click();
  await page.getByRole("button", { name: "Connect a local test chat" }).click();
  await expect(
    page.getByRole("button", { name: "Pause Telegram" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause Telegram" }).click();
  await expect(
    page.getByRole("button", { name: "Resume Telegram" }),
  ).toBeVisible();
  await page.getByText("Delete subscription", { exact: true }).click();
  await page.getByRole("button", { name: "Delete my subscription" }).click();
  await expect(page).toHaveURL("/");
});
