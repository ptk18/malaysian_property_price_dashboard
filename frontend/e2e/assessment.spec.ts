import { expect, test, type Page } from "@playwright/test";
import type { Assessment } from "../lib/types";

const assessment: Assessment = {
  listing_id: "fixture-subject",
  status: "available",
  asking_price: 500000,
  estimated_price: 400000,
  price_difference: 100000,
  price_difference_pct: 25,
  unavailable_reason: null,
  inputs: {
    size_sqft: 1087,
    bedrooms: 3,
    bathrooms: 2,
    facility_count: 8,
    property_type: "Condominium",
    tenure: "Freehold",
    land_title: "Non Bumi Lot",
    location: "Kuala Lumpur",
  },
  comparable_count: 1,
  comparables: [
    {
      id: "fixture-comparable",
      building_name: "Example residence",
      location: "Kuala Lumpur",
      property_type: "Condominium",
      price: 420000,
      size_sqft: 1100,
      bedrooms: 3,
      bathrooms: 2,
      price_per_sqft: 381.82,
    },
  ],
  comparable_rules:
    "Same location and property type, size within ±20%, and bedrooms within ±1.",
  model_name: "Random Forest",
};

async function search(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample filters" }).click();
  await page.getByRole("button", { name: "Find properties" }).click();
  await expect(page.getByRole("article")).toHaveCount(50);
}

for (const width of [1440, 390]) {
  test(`asking-price details preserve selections and keyboard focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/listings/*/assessment", (route) =>
      route.fulfill({ json: assessment }),
    );
    await search(page);
    const card = page.getByRole("article").first();
    await card.getByRole("checkbox").check();
    const trigger = card.getByRole("button", { name: "Assess asking price" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Assess asking price" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("RM 400,000", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText(
        "The asking price is RM 100,000 (25.00%) above the model estimate.",
      ),
    ).toBeVisible();
    await expect(
      dialog.getByText("Example residence", { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText(/not a formal valuation/)).toBeVisible();
    await dialog
      .getByText("Listing facts and estimate method", { exact: true })
      .click();
    await expect(dialog.getByText("Freehold", { exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await dialog.screenshot({ path: `test-results/assessment-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(card.getByRole("checkbox")).toBeChecked();
  });
}

test("missing listing facts explain why there is no estimate", async ({
  page,
}) => {
  await page.route("**/api/listings/*/assessment", (route) =>
    route.fulfill({
      json: {
        ...assessment,
        status: "unavailable",
        estimated_price: null,
        price_difference: null,
        price_difference_pct: null,
        unavailable_reason: "Not enough listing information: bathrooms.",
        inputs: { ...assessment.inputs, bathrooms: null },
        comparable_count: 0,
        comparables: [],
      },
    }),
  );
  await search(page);
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "Assess asking price" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Assess asking price" });
  await expect(
    dialog.getByText("Not enough listing information: bathrooms."),
  ).toBeVisible();
  await expect(
    dialog.getByText("Not available", { exact: true }).first(),
  ).toBeVisible();
  await expect(dialog.getByText(/No other listings meet/)).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test("assessment errors allow retry without blocking comparison", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/api/listings/*/assessment", (route) => {
    attempts++;
    return attempts === 1
      ? route.fulfill({ status: 503, json: { detail: "unavailable" } })
      : route.fulfill({ json: assessment });
  });
  await search(page);
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "Assess asking price" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Assess asking price" });
  await expect(dialog.getByRole("alert")).toContainText(
    "Price assessment is temporarily unavailable",
  );
  await dialog.getByRole("button", { name: "Retry assessment" }).click();
  await expect(dialog.getByText("RM 400,000", { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  const card = page.getByRole("article").first();
  await card.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Compare (1)", exact: true }).click();
  await expect(
    page.getByRole("region", {
      name: "Selected property comparison",
      exact: true,
    }),
  ).toBeVisible();
});
