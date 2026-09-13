import type { ShortlistController } from "../hooks/use-shortlist";
import { money } from "../lib/format";
import { SAMPLE_BRIEFS } from "../lib/sample-briefs";

export function BriefForm({ controller }: { controller: ShortlistController }) {
  const {
    brief,
    updateBrief,
    options,
    optionsError,
    applySample,
    parseBusy,
    extract,
    parseError,
    retryOptions,
    search,
    form,
    edit,
    budget,
    bedrooms,
    reviewNotes,
    reviewed,
    setReviewed,
    valid,
    searchBusy,
  } = controller;
  return (
    <section
      className="panel search-panel"
      aria-label="Buyer brief and filters"
    >
      <div className="brief-input">
        <div className="section-heading">
          <h2>Describe what you need</h2>
          <span className="optional-label">Optional</span>
        </div>
        <label htmlFor="brief">What are they looking for?</label>
        <textarea
          id="brief"
          maxLength={2000}
          value={brief}
          rows={3}
          aria-describedby="brief-help"
          placeholder="A 3-bedroom condo in Kuala Lumpur, around RM500,000…"
          onChange={(event) => updateBrief(event.target.value)}
        />
        <div className="sample-row" aria-label="Example briefs">
          <span>Examples</span>
          {SAMPLE_BRIEFS.map((sample, index) => (
            <button
              key={sample.label}
              className="chip-button"
              onClick={() => applySample(index)}
            >
              {sample.label}
            </button>
          ))}
        </div>
        <button
          className="button secondary extract-button"
          disabled={!brief.trim() || parseBusy || !options}
          onClick={extract}
        >
          {parseBusy ? "Extracting filters…" : "Extract filters"}
        </button>
        <p className="helper" id="brief-help">
          AI fills in the filters for you to review. Leave out personal details.
        </p>
        {parseError && (
          <p role="alert" className="alert">
            {parseError}
          </p>
        )}
      </div>
      <div className="filter-input">
        <div className="section-heading">
          <h2>Choose your filters</h2>
          <button
            className="text-button"
            onClick={() => applySample(0, true)}
            disabled={!options}
          >
            Try sample filters
          </button>
        </div>
        {optionsError && (
          <div role="alert" className="alert">
            {optionsError}{" "}
            <button className="text-button" onClick={retryOptions}>
              Retry loading options
            </button>
          </div>
        )}
        {!options && !optionsError && (
          <p role="status">Loading available locations…</p>
        )}
        <form onSubmit={search} aria-label="Property search">
          <div className="filter-grid">
            <div>
              <label htmlFor="location">Dataset location</label>
              <select
                id="location"
                value={form.location}
                onChange={(e) => edit("location", e.target.value)}
                required
                disabled={!options}
                aria-describedby="search-ranges"
              >
                <option value="">Choose a location</option>
                {options?.locations.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type">Property type</label>
              <select
                id="type"
                value={form.property_type}
                onChange={(e) => edit("property_type", e.target.value)}
                required
                disabled={!options}
                aria-describedby="search-ranges"
              >
                <option value="">Choose a type</option>
                {options?.property_types.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budget">Target budget (RM)</label>
              <input
                id="budget"
                inputMode="decimal"
                type="number"
                min="0.01"
                max="1000000000000"
                step="any"
                placeholder="500000"
                value={form.budget}
                onChange={(e) => edit("budget", e.target.value)}
                aria-describedby="search-ranges"
                required
              />
            </div>
            <div>
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                id="bedrooms"
                inputMode="numeric"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="3"
                value={form.bedrooms}
                onChange={(e) => edit("bedrooms", e.target.value)}
                aria-describedby="search-ranges"
                required
              />
            </div>
          </div>
          <div className="range-note" id="search-ranges">
            <strong>Search range</strong>
            <span>
              {budget > 0 && Number.isFinite(budget)
                ? `${money(budget * 0.9, 2)} – ${money(budget * 1.1, 2)}`
                : "Target budget ±10%"}
              {" · "}
              {form.bedrooms !== "" &&
              Number.isInteger(bedrooms) &&
              bedrooms >= 0
                ? `${Math.max(0, bedrooms - 1)}–${bedrooms + 1} bedrooms`
                : "Bedrooms ±1"}
            </span>
            <span>Location and property type stay exact.</span>
          </div>
          {reviewNotes.length > 0 && (
            <div className="review-notes" role="status">
              <strong>Review before searching</strong>
              <ul>
                {reviewNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                I have reviewed these notes and accept the displayed ranges.
              </label>
            </div>
          )}
          <button
            className="button primary full"
            type="submit"
            disabled={
              !valid || searchBusy || (reviewNotes.length > 0 && !reviewed)
            }
          >
            {searchBusy ? "Finding properties…" : "Find properties"}
          </button>
        </form>
      </div>
    </section>
  );
}
