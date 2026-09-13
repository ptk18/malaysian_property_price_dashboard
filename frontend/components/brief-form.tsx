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
    <aside className="panel brief-panel" aria-label="Buyer brief and filters">
      <div className="section-heading">
        <span className="step-number">01</span>
        <div>
          <h2>The buyer’s brief</h2>
          <p>Start with their priorities.</p>
        </div>
      </div>
      <label htmlFor="brief">What are they looking for?</label>
      <textarea
        id="brief"
        maxLength={2000}
        value={brief}
        rows={5}
        placeholder="A 3-bedroom condo in Kuala Lumpur, target budget RM500,000…"
        onChange={(event) => {
          updateBrief(event.target.value);
        }}
      />
      <div className="input-meta">
        <span>English · optional AI assist</span>
        <span>{brief.length}/2,000</span>
      </div>
      <div className="sample-row">
        <span>Try a brief</span>
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
        className="button extract-button"
        disabled={!brief.trim() || parseBusy || !options}
        onClick={extract}
      >
        {parseBusy ? "Extracting filters…" : "✦ Extract filters"}
      </button>
      <p className="helper">
        AI suggests filters. You review them before searching. Avoid personal
        contact details.
      </p>
      {parseError && (
        <p role="alert" className="alert">
          {parseError}
        </p>
      )}
      <div className="form-divider">
        <span>Review or enter filters manually</span>
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
      <form onSubmit={search}>
        <label htmlFor="location">
          Dataset location <span className="field-tag">Exact</span>
        </label>
        <select
          id="location"
          value={form.location}
          onChange={(e) => edit("location", e.target.value)}
          required
          disabled={!options}
        >
          <option value="">Choose a location</option>
          {options?.locations.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <label htmlFor="type">
          Property type <span className="field-tag">Exact</span>
        </label>
        <select
          id="type"
          value={form.property_type}
          onChange={(e) => edit("property_type", e.target.value)}
          required
          disabled={!options}
        >
          <option value="">Choose a type</option>
          {options?.property_types.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <div className="form-pair">
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
              required
            />
          </div>
        </div>
        <div className="range-note">
          <strong>Your search ranges</strong>
          <span>
            {budget > 0 && Number.isFinite(budget)
              ? `${money(budget * 0.9, 2)} – ${money(budget * 1.1, 2)}`
              : "Target budget ±10%"}
          </span>
          <span>
            {form.bedrooms !== "" && Number.isInteger(bedrooms) && bedrooms >= 0
              ? `${Math.max(0, bedrooms - 1)}–${bedrooms + 1} bedrooms`
              : "Bedroom count ±1"}{" "}
            · location and type stay exact
          </span>
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
          <span aria-hidden="true">→</span>
        </button>
        <p className="helper">
          Confirming searches the displayed ranges. It never changes them
          automatically.
        </p>
      </form>
    </aside>
  );
}
