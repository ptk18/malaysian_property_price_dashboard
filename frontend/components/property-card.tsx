import { bedroomTradeoff, count, money, priceTradeoff } from "../lib/format";
import type { Listing } from "../lib/types";

type PropertyCardProps = {
  listing: Listing;
  index: number;
  isSelected: boolean;
  selectionLimitReached: boolean;
  onToggle: (id: string) => void;
};

export function PropertyCard({
  listing,
  index,
  isSelected,
  selectionLimitReached,
  onToggle,
}: PropertyCardProps) {
  return (
    <article
      className={`panel property-card ${isSelected ? "is-selected" : ""}`}
    >
      <div className="property-top">
        <span className="property-kind">{listing.property_type}</span>
        <span className="rank">#{index + 1}</span>
      </div>
      <h3>{listing.building_name || "Unnamed property"}</h3>
      <p className="location-text">{listing.location}</p>
      <div className="asking-price">
        {money(listing.price)}
        <span>asking price</span>
      </div>
      <dl className="property-facts">
        <div>
          <dt>Bedrooms</dt>
          <dd>{listing.bedrooms}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>
            {listing.size_sqft === null
              ? "Not available"
              : `${count(listing.size_sqft)} sq ft`}
          </dd>
        </div>
        <div>
          <dt>Per sq ft</dt>
          <dd>{money(listing.price_per_sqft, 2)}</dd>
        </div>
      </dl>
      <div className="tradeoffs">
        <span
          className={
            listing.bedroom_delta === 0 ? "badge exact" : "badge warning"
          }
        >
          {bedroomTradeoff(listing.bedroom_delta)}
        </span>
        <span className={listing.price_delta > 0 ? "badge warning" : "badge"}>
          {priceTradeoff(listing.price_delta_pct)}
        </span>
      </div>
      <label
        className={`select-property ${selectionLimitReached && !isSelected ? "disabled" : ""}`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={selectionLimitReached && !isSelected}
          onChange={() => onToggle(listing.id)}
          aria-label={`Compare ${listing.building_name || "unnamed property"}, result ${index + 1}`}
        />
        {isSelected ? "Selected" : "Compare property"}
      </label>
    </article>
  );
}
