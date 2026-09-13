import { forwardRef } from "react";
import { bedroomTradeoff, count, money, priceTradeoff } from "../lib/format";
import type { Listing } from "../lib/types";
const rows: { label: string; value: (listing: Listing) => string | number }[] =
  [
    { label: "Asking price", value: (r) => money(r.price) },
    {
      label: "Budget tradeoff",
      value: (r) => priceTradeoff(r.price_delta_pct),
    },
    { label: "Bedrooms", value: (r) => r.bedrooms },
    {
      label: "Bedroom tradeoff",
      value: (r) => bedroomTradeoff(r.bedroom_delta),
    },
    {
      label: "Size",
      value: (r) =>
        r.size_sqft === null ? "Not available" : `${count(r.size_sqft)} sq ft`,
    },
    { label: "Price per sq ft", value: (r) => money(r.price_per_sqft, 2) },
    { label: "Bathrooms", value: (r) => r.bathrooms ?? "Not available" },
    { label: "Dataset location", value: (r) => r.location },
    { label: "Property type", value: (r) => r.property_type },
  ];
export const Comparison = forwardRef<
  HTMLElement,
  { listings: Listing[]; onRemove: (id: string) => void; onClose: () => void }
>(function Comparison({ listings, onRemove, onClose }, ref) {
  return (
    <section
      className="panel comparison"
      ref={ref}
      tabIndex={-1}
      aria-label="Selected property comparison"
    >
      <div className="results-heading">
        <div>
          <h2>Compare properties</h2>
        </div>
        <button className="text-button" onClick={onClose}>
          Back to results
        </button>
      </div>
      <p className="helper">
        Compare listing facts side by side. Scroll across to see every property.
      </p>
      <div
        className="table-scroll"
        role="region"
        aria-label="Property comparison table"
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">
            Comparison of {listings.length} selected properties
          </caption>
          <thead>
            <tr>
              <th scope="col">Property details</th>
              {listings.map((listing) => (
                <th scope="col" key={listing.id}>
                  {listing.building_name || "Unnamed property"}
                  <button
                    className="text-button remove-button"
                    onClick={() => {
                      onRemove(listing.id);
                      if (listings.length === 1) onClose();
                    }}
                    aria-label={`Remove ${listing.building_name || "unnamed property"} from comparison`}
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {listings.map((listing) => (
                  <td key={listing.id}>{row.value(listing)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
