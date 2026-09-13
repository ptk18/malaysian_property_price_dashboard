"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { count, money } from "../lib/format";
import { request, getErrorMessage } from "../lib/api";
import type { Analytics } from "../lib/types";

export function AnalyticsView() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    request<Analytics>("/api/analytics/overview")
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const bins = data?.price_distribution.filter((bin) => !bin.is_overflow) || [];
  const overflow = data?.price_distribution.find((bin) => bin.is_overflow);
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  return (
    <section aria-label="Dataset analytics">
      <div className="page-intro">
        <h1>Listing analytics</h1>
        <p>All listings · Asking prices across the Malaysian dataset.</p>
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}{" "}
          <button
            className="text-button"
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Retry analytics
          </button>
        </div>
      )}
      {!data && !error && (
        <div className="panel loading-state" role="status">
          Loading dataset analytics…
        </div>
      )}
      {data && (
        <>
          <div className="metrics">
            <div className="panel metric">
              <span>Total listings</span>
              <strong>{count(data.total_listings)}</strong>
              <p>Across the full dataset</p>
            </div>
            <div className="panel metric">
              <span>Median asking price</span>
              <strong>{money(data.median_asking_price)}</strong>
              <p>Based on {count(data.valid_price_count)} valid prices</p>
            </div>
            <div className="panel metric">
              <span>Dataset locations</span>
              <strong>{count(data.by_location.length)}</strong>
              <p>
                {count(data.missing_location_count)} listings without a location
                label
              </p>
            </div>
          </div>
          <section className="panel chart-panel">
            <div className="results-heading">
              <div>
                <h2>Where listings are priced</h2>
              </div>
              <span className="pill">All listings</span>
            </div>
            <p className="helper">
              Listing counts by asking-price band. The top price tail is counted
              separately below.
            </p>
            <div
              className="histogram"
              role="img"
              aria-label="Asking-price distribution. Exact bands and listing counts are available in the table below."
            >
              <div className="axis-label">Number of listings</div>
              <div className="bars">
                {bins.map((bin, index) => (
                  <div className="bar-column" key={index}>
                    <span className="bar-count">{count(bin.count)}</span>
                    <div className="bar-track">
                      <div
                        className="bar"
                        style={
                          {
                            "--bar-fraction": bin.count / maxCount,
                          } as CSSProperties
                        }
                      />
                    </div>
                    <span className="bar-label">
                      {Math.round(bin.bin_start / 1000)}k
                    </span>
                  </div>
                ))}
              </div>
              <div className="x-axis-label">
                Asking-price band starts (RM thousands)
              </div>
            </div>
            {overflow && (
              <p className="overflow-note">
                <strong>
                  {count(overflow.count)} listings in the upper price tail:
                </strong>{" "}
                above {money(overflow.bin_start, 2)}, up to{" "}
                {money(overflow.bin_end)}. This separate bucket has a wider
                price range.
              </p>
            )}
            <details className="data-details">
              <summary>View exact price bands and counts</summary>
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">
                    All price distribution bins including overflow
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Price band (MYR)</th>
                      <th scope="col">Listings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.price_distribution.map((bin, i) => (
                      <tr key={i}>
                        <th scope="row">
                          {bin.is_overflow ? "Upper tail: above " : "From "}
                          {money(bin.bin_start, 2)} to {money(bin.bin_end, 2)}
                        </th>
                        <td>{count(bin.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
          <section className="panel chart-panel">
            <div className="results-heading">
              <div>
                <h2>Prices by location</h2>
              </div>
            </div>
            <p className="helper">
              Ordered by listing count. Labels are drawn from the dataset and
              mix geographic levels; they are not verified state boundaries.
            </p>
            <div className="table-scroll">
              <table className="location-table">
                <caption className="sr-only">
                  Listing count and median asking price by dataset location
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Dataset location</th>
                    <th scope="col">Listing count</th>
                    <th scope="col">Median asking price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_location.map((row) => (
                    <tr key={row.location}>
                      <th scope="row">{row.location}</th>
                      <td>
                        <div className="count-bar">
                          <span className="count-track" aria-hidden="true">
                            <span
                              style={{
                                width: `${(row.count / Math.max(1, data.by_location[0].count)) * 100}%`,
                              }}
                            />
                          </span>
                          {count(row.count)}
                        </div>
                      </td>
                      <td>{money(row.median_asking_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="helper">
              Location counts + {count(data.missing_location_count)}{" "}
              missing-location listings = {count(data.total_listings)} total
              listings.
            </p>
          </section>
        </>
      )}
    </section>
  );
}
