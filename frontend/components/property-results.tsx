import { useRef } from "react";
import type { ShortlistController } from "../hooks/use-shortlist";
import { count, money } from "../lib/format";
import { Comparison } from "./comparison";
import { PropertyCard } from "./property-card";

export function PropertyResults({
  controller,
}: {
  controller: ShortlistController;
}) {
  const {
    searchBusy,
    matches,
    searchError,
    changed,
    applySample,
    selected,
    setComparing,
    comparing,
    compared,
    toggle,
  } = controller;
  const comparisonRef = useRef<HTMLElement>(null);
  const compareButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <section className="results-column" aria-label="Property matches">
      <div className="rules-grid">
        <div>
          <span>01 / LOCATION</span>
          <strong>Stay in the right place</strong>
          <p>Exact dataset location & type</p>
        </div>
        <div>
          <span>02 / PRIORITY</span>
          <strong>Bedrooms come first</strong>
          <p>Then closest to target budget</p>
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="result-status">
        {searchBusy
          ? "Finding properties within your confirmed ranges…"
          : matches
            ? `${count(matches.total)} matching properties. Showing ${matches.results.length}.`
            : "Ready when you are."}
      </div>
      {searchError && (
        <p role="alert" className="alert">
          {searchError}
        </p>
      )}
      {changed && (
        <p className="alert">
          Filters have changed. These results use your last confirmed search.
          Select Find properties to refresh.
        </p>
      )}
      {!matches && !searchBusy && (
        <div className="panel empty-state">
          <div className="empty-icon" aria-hidden="true">
            ⌂
          </div>
          <p className="eyebrow">A SHORTLIST WITH A REASON</p>
          <h2>
            The right options start
            <br />
            with a clear brief.
          </h2>
          <p>
            Review your buyer’s needs on the left. We’ll find eligible
            properties and make every tradeoff visible.
          </p>
          <button
            className="button secondary"
            onClick={() => applySample(0, true)}
          >
            Try sample filters <span aria-hidden="true">↗</span>
          </button>
          <div className="empty-footnote">
            Asking-price data · No login needed
          </div>
        </div>
      )}
      {searchBusy && (
        <div className="panel loading-state" role="status">
          Checking location, price and bedrooms…
        </div>
      )}
      {matches && matches.total === 0 && (
        <div className="panel empty-state">
          <h2>No properties in this range</h2>
          <p>
            Try editing the target budget, bedrooms, location or property type.
            We’ll keep your chosen rules until you change them.
          </p>
        </div>
      )}
      {matches && matches.total > 0 && (
        <>
          <div className="results-heading">
            <div>
              <h2>Your property matches</h2>
              <p>
                {matches.applied_filters.location} ·{" "}
                {matches.applied_filters.property_type} · target{" "}
                {money(matches.applied_filters.budget)}
              </p>
            </div>
            <span className="pill">Bedrooms first</span>
          </div>
          <div className="selection-bar">
            <span>
              <strong>{selected.length} of 3</strong> selected
              {selected.length === 3
                ? " · Remove one to choose another"
                : " for comparison"}
            </span>
            <button
              ref={compareButtonRef}
              className="button primary compact"
              disabled={!selected.length}
              onClick={() => {
                setComparing(true);
                setTimeout(() => {
                  comparisonRef.current?.focus();
                  comparisonRef.current?.scrollIntoView({
                    behavior: "instant",
                    block: "start",
                  });
                }, 0);
              }}
            >
              Compare ({selected.length})
            </button>
          </div>
          {comparing && compared.length > 0 && (
            <Comparison
              ref={comparisonRef}
              listings={compared}
              onRemove={toggle}
              onClose={() => {
                setComparing(false);
                compareButtonRef.current?.focus();
              }}
            />
          )}
          <div className="property-grid">
            {matches.results.map((listing, index) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                index={index}
                isSelected={selected.includes(listing.id)}
                selectionLimitReached={selected.length === 3}
                onToggle={toggle}
              />
            ))}
          </div>
          {matches.total > matches.limit && (
            <p className="helper results-limit">
              Showing the first {matches.limit} of {count(matches.total)}{" "}
              matches. Refine your filters to narrow the selection.
            </p>
          )}
        </>
      )}
    </section>
  );
}
