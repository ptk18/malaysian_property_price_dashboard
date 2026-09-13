import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import Page from "../app/page";
import { request } from "../lib/api";
vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  request: vi.fn(),
}));
const options = {
  locations: ["Kuala Lumpur", "Selangor"],
  property_types: ["Condominium", "Apartment"],
  currency: "MYR",
  area_unit: "sq ft",
  dataset_version: "fixture",
};
beforeEach(() => {
  vi.mocked(request).mockReset();
  vi.mocked(request).mockResolvedValue(options);
});
test("the application renders its entry page", async () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { name: "Property shortlist" }),
  ).toBeInTheDocument();
  await screen.findByRole("option", { name: "Kuala Lumpur" });
});

test("extraction never searches automatically and manual edits determine the confirmed request", async () => {
  const user = userEvent.setup();
  render(<Page />);
  await screen.findByRole("option", { name: "Kuala Lumpur" });
  vi.mocked(request).mockResolvedValueOnce({
    filters: {
      location: "Kuala Lumpur",
      property_type: "Condominium",
      budget: 500000,
      bedrooms: 3,
    },
    review_notes: [],
  });
  await user.click(screen.getByRole("button", { name: "Kuala Lumpur condo" }));
  await user.click(screen.getByRole("button", { name: /Extract filters/ }));
  await waitFor(() =>
    expect(screen.getByLabelText("Target budget (RM)")).toHaveValue(500000),
  );
  expect(
    vi.mocked(request).mock.calls.some(([path]) => path === "/api/shortlist"),
  ).toBe(false);
  await user.clear(screen.getByLabelText("Target budget (RM)"));
  await user.type(screen.getByLabelText("Target budget (RM)"), "480000");
  vi.mocked(request).mockResolvedValueOnce({
    results: [],
    total: 0,
    limit: 50,
    applied_filters: {
      location: "Kuala Lumpur",
      property_type: "Condominium",
      budget: 480000,
      bedrooms: 3,
    },
  });
  await user.click(screen.getByRole("button", { name: "Find properties" }));
  expect(request).toHaveBeenLastCalledWith("/api/shortlist", {
    location: "Kuala Lumpur",
    property_type: "Condominium",
    budget: 480000,
    bedrooms: 3,
  });
  await screen.findByText("No properties in this range");
});

test("an extraction arriving after a manual edit cannot overwrite the newer input", async () => {
  const user = userEvent.setup();
  render(<Page />);
  await screen.findByRole("option", { name: "Kuala Lumpur" });
  let resolve!: (value: unknown) => void;
  vi.mocked(request).mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  await user.click(screen.getByRole("button", { name: "Kuala Lumpur condo" }));
  await user.click(screen.getByRole("button", { name: /Extract filters/ }));
  await user.type(screen.getByLabelText("Target budget (RM)"), "480000");
  await act(async () =>
    resolve({
      filters: {
        location: "Kuala Lumpur",
        property_type: "Condominium",
        budget: 500000,
        bedrooms: 3,
      },
      review_notes: [],
    }),
  );
  expect(screen.getByLabelText("Target budget (RM)")).toHaveValue(480000);
});

test("hard-limit wording requires explicit review of the displayed range", async () => {
  const user = userEvent.setup();
  render(<Page />);
  await screen.findByRole("option", { name: "Kuala Lumpur" });
  await user.click(screen.getByRole("button", { name: /Try sample filters/ }));
  await user.clear(screen.getByLabelText("What are they looking for?"));
  await user.type(
    screen.getByLabelText("What are they looking for?"),
    "Under RM500k",
  );
  expect(
    screen.getByRole("button", { name: "Find properties" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /I have reviewed/ }));
  expect(screen.getByRole("button", { name: "Find properties" })).toBeEnabled();
});
