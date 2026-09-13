"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getErrorMessage, request } from "../lib/api";
import { SAMPLE_BRIEFS } from "../lib/sample-briefs";
import type {
  Extraction,
  Filters,
  Listing,
  Matches,
  Options,
  SearchForm,
} from "../lib/types";

const EMPTY_FORM: SearchForm = {
  location: "",
  property_type: "",
  budget: "",
  bedrooms: "",
};

export function useShortlist() {
  const [options, setOptions] = useState<Options | null>(null);
  const [optionsError, setOptionsError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [brief, setBrief] = useState("");
  const [form, setForm] = useState<SearchForm>(EMPTY_FORM);
  const [notes, setNotes] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [parseBusy, setParseBusy] = useState(false);
  const [parseError, setParseError] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [matches, setMatches] = useState<Matches | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const parseVersion = useRef(0),
    searchVersion = useRef(0);

  useEffect(() => {
    let active = true;
    request<Options>("/api/shortlist/options")
      .then((value) => {
        if (active) {
          setOptions(value);
          setOptionsError("");
        }
      })
      .catch((error) => {
        if (active) setOptionsError(error.message);
      });
    return () => {
      active = false;
    };
  }, [optionsRetry]);

  function invalidateRequests() {
    // Ignore requests started before the latest edit or confirmed search.
    parseVersion.current++;
    searchVersion.current++;
    setParseBusy(false);
    setSearchBusy(false);
    setReviewed(false);
  }
  function edit(field: keyof SearchForm, value: string) {
    invalidateRequests();
    setForm((previous) => ({ ...previous, [field]: value }));
  }
  function applySample(index: number, withFilters = false) {
    invalidateRequests();
    const sample = SAMPLE_BRIEFS[index];
    setBrief(sample.brief);
    setParseError("");
    setNotes([]);
    if (withFilters)
      setForm({
        location: sample.location,
        property_type: sample.property_type,
        budget: sample.budget,
        bedrooms: sample.bedrooms,
      });
  }

  const budget = Number(form.budget),
    bedrooms = Number(form.bedrooms);
  const hasHardLimit =
    /\b(under|below|at most|maximum|max|no more than|not (?:over|above)|up to|ceiling)\b/i.test(
      brief,
    );
  const reviewNotes = [...notes];
  if (hasHardLimit && !notes.some((n) => n.includes("hard limit")))
    reviewNotes.push(
      "Your brief may specify a hard limit. This search uses a target budget ±10%; review the displayed range.",
    );
  const valid =
    !!options &&
    options.locations.includes(form.location) &&
    options.property_types.includes(form.property_type) &&
    form.budget !== "" &&
    Number.isFinite(budget) &&
    budget > 0 &&
    budget <= 1e12 &&
    form.bedrooms !== "" &&
    Number.isInteger(bedrooms) &&
    bedrooms >= 0 &&
    bedrooms <= 100;

  async function extract() {
    const version = ++parseVersion.current;
    searchVersion.current++;
    setSearchBusy(false);
    setParseBusy(true);
    setParseError("");
    setNotes([]);
    setReviewed(false);
    try {
      const result = await request<Extraction>("/api/brief/parse", { brief });
      if (version !== parseVersion.current) return;
      setForm({
        location: result.filters.location ?? "",
        property_type: result.filters.property_type ?? "",
        budget:
          result.filters.budget === null ? "" : String(result.filters.budget),
        bedrooms:
          result.filters.bedrooms === null
            ? ""
            : String(result.filters.bedrooms),
      });
      setNotes(result.review_notes);
    } catch (error) {
      if (version === parseVersion.current)
        setParseError(getErrorMessage(error));
    } finally {
      if (version === parseVersion.current) setParseBusy(false);
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!valid || (reviewNotes.length > 0 && !reviewed)) return;
    const version = ++searchVersion.current;
    parseVersion.current++;
    setParseBusy(false);
    setSearchBusy(true);
    setSearchError("");
    setSelected([]);
    setComparing(false);
    setMatches(null);
    try {
      const filters: Filters = {
        location: form.location,
        property_type: form.property_type,
        budget,
        bedrooms,
      };
      const result = await request<Matches>("/api/shortlist", filters);
      if (version === searchVersion.current) setMatches(result);
    } catch (error) {
      if (version === searchVersion.current)
        setSearchError(getErrorMessage(error));
    } finally {
      if (version === searchVersion.current) setSearchBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  const compared = selected
    .map((id) => matches?.results.find((row) => row.id === id))
    .filter((row): row is Listing => !!row);
  const changed =
    matches &&
    (matches.applied_filters.location !== form.location ||
      matches.applied_filters.property_type !== form.property_type ||
      matches.applied_filters.budget !== budget ||
      matches.applied_filters.bedrooms !== bedrooms);

  function updateBrief(value: string) {
    invalidateRequests();
    setBrief(value);
    setNotes([]);
    setParseError("");
  }

  function retryOptions() {
    setOptionsError("");
    setOptionsRetry((value) => value + 1);
  }

  return {
    options,
    optionsError,
    brief,
    form,
    reviewed,
    setReviewed,
    parseBusy,
    parseError,
    searchBusy,
    searchError,
    matches,
    selected,
    comparing,
    setComparing,
    compared,
    changed,
    budget,
    bedrooms,
    reviewNotes,
    valid,
    edit,
    applySample,
    updateBrief,
    retryOptions,
    extract,
    search,
    toggle,
  };
}

export type ShortlistController = ReturnType<typeof useShortlist>;
