import { useEffect, useRef } from "react";
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
    selected,
    setComparing,
    comparing,
    compared,
    toggle,
  } = controller;
  const resultsRef = useRef<HTMLElement>(null);
  const comparisonRef = useRef<HTMLElement>(null);
  const compareButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // A confirmed mobile search should bring its results into view below the form.
    if (
      matches &&
      window.matchMedia("(max-width: 720px)").matches &&
      !resultsRef.current?.closest("[hidden]")
    ) {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, [matches]);

  return (
    <section
      ref={resultsRef}
      tabIndex={-1}
      className="results-column"
      aria-label="Property matches"
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className={matches || searchBusy ? "result-status" : "sr-only"}
      >
        {searchBusy
          ? "Finding properties within your confirmed ranges…"
          : matches
            ? `${count(matches.total)} matching properties. Showing ${matches.results.length}.`
            : ""}
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
        <div className="empty-state">
          <h2>Your matches will appear here</h2>
          <p>Choose your filters, then select Find properties.</p>
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
            <p className="sort-note">
              Bedroom match first, then closest budget
            </p>
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
          <div
            className="property-grid"
            hidden={comparing && compared.length > 0}
          >
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
          {!comparing && matches.total > matches.limit && (
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
