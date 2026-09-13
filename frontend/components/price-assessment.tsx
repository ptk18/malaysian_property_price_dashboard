import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { getErrorMessage, request } from "../lib/api";
import { count, money } from "../lib/format";
import type { Assessment, Listing } from "../lib/types";

const inputLabels: Record<keyof Assessment["inputs"], string> = {
  size_sqft: "Size (sq ft)",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  facility_count: "Facilities recorded",
  property_type: "Property type",
  tenure: "Tenure",
  land_title: "Land title",
  location: "Dataset location",
};

export function PriceAssessment({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    request<Assessment>(
      `/api/listings/${encodeURIComponent(listing.id)}/assessment`,
    )
      .then((value) => {
        if (active) setAssessment(value);
      })
      .catch((reason) => {
        if (active) setError(getErrorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, [listing.id, attempt]);

  const difference = assessment?.price_difference;
  const differencePct = assessment?.price_difference_pct;

  function keepFocusInDialog(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not(:disabled), summary",
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="assessment-dialog"
      aria-labelledby={headingId}
      onClose={onClose}
      onKeyDown={keepFocusInDialog}
    >
      <div className="assessment-header">
        <h2 id={headingId}>Assess asking price</h2>
        <button
          className="text-button"
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </div>
      <div className="assessment-body">
        <h3>{listing.building_name || "Unnamed property"}</h3>
        <p className="location-text">
          {listing.location} · {listing.property_type}
        </p>
        {!assessment && !error && (
          <p className="loading-state" role="status">
            Assessing this listing’s asking price…
          </p>
        )}
        {error && (
          <div className="alert" role="alert">
            <p>{error}</p>
            <button
              className="text-button"
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Retry assessment
            </button>
          </div>
        )}
        {assessment && (
          <>
            <dl className="assessment-prices">
              <div>
                <dt>Asking price</dt>
                <dd>{money(assessment.asking_price)}</dd>
              </div>
              <div>
                <dt>Listing-price estimate</dt>
                <dd>{money(assessment.estimated_price)}</dd>
              </div>
            </dl>
            {assessment.status === "available" &&
              difference !== null &&
              difference !== undefined &&
              differencePct !== null &&
              differencePct !== undefined && (
                <p className="assessment-difference">
                  {difference === 0
                    ? "The asking price matches the model estimate."
                    : `The asking price is ${money(Math.abs(difference))} (${Math.abs(differencePct).toFixed(2)}%) ${difference > 0 ? "above" : "below"} the model estimate.`}
                </p>
              )}
            {assessment.status === "unavailable" && (
              <p className="alert" role="status">
                {assessment.unavailable_reason}
              </p>
            )}
            <p className="helper">
              Based on advertised prices, not a formal valuation. Property
              condition and current availability are not assessed.
            </p>
            <section
              className="assessment-comparables"
              aria-label="Comparable listings"
            >
              <h3>Comparable listings</h3>
              <p className="helper">{assessment.comparable_rules}</p>
              {assessment.comparables.length > 0 ? (
                <>
                  <p className="helper">
                    Showing {assessment.comparables.length} of{" "}
                    {count(assessment.comparable_count)} comparable listings.
                    The assessed listing and exact duplicates are excluded.
                  </p>
                  <ul>
                    {assessment.comparables.map((comparable) => (
                      <li key={comparable.id}>
                        <div>
                          <strong>
                            {comparable.building_name || "Unnamed property"}
                          </strong>
                          <p>
                            {comparable.bedrooms ?? "Not available"} bedrooms ·{" "}
                            {comparable.size_sqft === null
                              ? "Size not available"
                              : `${count(comparable.size_sqft)} sq ft`}
                          </p>
                        </div>
                        <span>{money(comparable.price)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="helper">
                  No other listings meet these comparison rules. We haven’t
                  widened the search.
                </p>
              )}
            </section>
            <details className="assessment-method">
              <summary>Listing facts and estimate method</summary>
              <dl className="assessment-facts">
                {Object.entries(inputLabels).map(([field, label]) => (
                  <div key={field}>
                    <dt>{label}</dt>
                    <dd>
                      {assessment.inputs[field as keyof Assessment["inputs"]] ??
                        "Not available"}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="helper">
                {assessment.model_name} model using the recorded listing facts
                above. No missing facts are filled in. These advertisements may
                overlap the model’s training data; comparable listings provide
                context, not independent validation.
              </p>
            </details>
          </>
        )}
      </div>
    </dialog>
  );
}
