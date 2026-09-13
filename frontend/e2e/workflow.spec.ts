import { test, expect } from "@playwright/test";

test("manual search, three-property comparison, new-search reset, and analytics", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("option", { name: "Kuala Lumpur", exact: true }),
  ).toBeAttached();
  await page.screenshot({
    path: "test-results/desktop-entry.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Try sample filters" }).click();
  await page.getByRole("button", { name: "Find properties" }).click();
  await expect(
    page.getByText("72 matching properties. Showing 50."),
  ).toBeVisible();
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(50);
  await expect(cards.first().getByText("Exact bedrooms")).toBeVisible();
  for (let i = 0; i < 3; i++) await cards.nth(i).getByRole("checkbox").check();
  await expect(cards.nth(3).getByRole("checkbox")).toBeDisabled();
  await page.getByRole("button", { name: "Compare (3)", exact: true }).click();
  const comparison = page.getByRole("region", {
    name: "Selected property comparison",
    exact: true,
  });
  await expect(comparison).toBeVisible();
  await expect(
    comparison.getByRole("heading", { name: "See the tradeoffs" }),
  ).toBeInViewport();
  await expect(comparison.getByRole("columnheader")).toHaveCount(4);
  await page.screenshot({ path: "test-results/desktop-comparison.png" });
  await comparison
    .getByRole("button", { name: /Remove/ })
    .first()
    .click();
  await expect(comparison.getByRole("columnheader")).toHaveCount(3);
  await page.getByRole("button", { name: "Back to results" }).click();
  await page.getByLabel("Target budget (RM)").fill("1");
  await page.getByRole("button", { name: "Find properties" }).click();
  await expect(
    page.getByRole("heading", { name: "No properties in this range" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Selected property comparison",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.getByText("3,604", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Where listings are priced" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/desktop-analytics.png" });
});

test("mocked Gemini extraction stays editable and searches only after confirmation", async ({
  page,
}) => {
  let searches = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/shortlist")) searches++;
  });
  await page.route("**/api/brief/parse", (route) =>
    route.fulfill({
      json: {
        filters: {
          location: "Kuala Lumpur",
          property_type: "Condominium",
          budget: 500000,
          bedrooms: 3,
        },
        review_notes: [],
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Kuala Lumpur condo" }).click();
  await page.getByRole("button", { name: "Extract filters" }).click();
  await expect(page.getByLabel("Target budget (RM)")).toHaveValue("500000");
  expect(searches).toBe(0);
  await page.getByLabel("Target budget (RM)").fill("480000");
  const requestPromise = page.waitForRequest((request) =>
    request.url().endsWith("/api/shortlist"),
  );
  await page.getByRole("button", { name: "Find properties" }).click();
  expect((await requestPromise).postDataJSON().budget).toBe(480000);
  await expect(
    page.getByRole("heading", { name: "Your property matches" }),
  ).toBeVisible();
});

test("quota failure preserves manual filtering", async ({ page }) => {
  await page.route("**/api/brief/parse", (route) =>
    route.fulfill({ status: 429, json: { detail: "quota" } }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample filters" }).click();
  await page.getByRole("button", { name: "Extract filters" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Today's AI allowance is used" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find properties" }).click();
  await expect(
    page.getByRole("heading", { name: "Your property matches" }),
  ).toBeVisible();
});

test("mobile flow has no whole-page overflow and comparison scrolls independently", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample filters" }).click();
  await page.screenshot({
    path: "test-results/mobile-entry.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Find properties" }).click();
  const cards = page.getByRole("article");
  for (let i = 0; i < 3; i++) await cards.nth(i).getByRole("checkbox").check();
  await page.getByRole("button", { name: "Compare (3)", exact: true }).click();
  await expect(
    page.getByRole("region", {
      name: "Property comparison table",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "See the tradeoffs" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-comparison.png" });
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page.getByText("3,604", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-analytics.png" });
});

test("keyboard user can enter the workflow", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByLabel("What are they looking for?").focus();
  await expect(page.getByLabel("What are they looking for?")).toBeFocused();
});
