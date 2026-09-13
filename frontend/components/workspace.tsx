"use client";

import { useState } from "react";
import { useShortlist } from "../hooks/use-shortlist";
import { AnalyticsView } from "./analytics";
import { BriefForm } from "./brief-form";
import { PropertyResults } from "./property-results";

export function Workspace() {
  const [tab, setTab] = useState<"shortlist" | "analytics">("shortlist");
  const shortlist = useShortlist();

  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="topbar">
        <strong className="brand">Property shortlist</strong>
        <nav aria-label="Workspace">
          <button
            aria-pressed={tab === "shortlist"}
            onClick={() => setTab("shortlist")}
          >
            Shortlist
          </button>
          <button
            aria-pressed={tab === "analytics"}
            onClick={() => setTab("analytics")}
          >
            Analytics
          </button>
        </nav>
      </header>
      <main id="workspace" className="workspace" tabIndex={-1}>
        <section hidden={tab !== "shortlist"}>
          <div className="page-intro">
            <h1>Property shortlist</h1>
            <p>Find properties that fit. Compare the details that matter.</p>
          </div>
          <BriefForm controller={shortlist} />
          <PropertyResults controller={shortlist} />
        </section>
        {tab === "analytics" && <AnalyticsView />}
        <footer className="footer">
          <p>Malaysian advertised listings · MYR · sq ft</p>
          <details>
            <summary>About this data</summary>
            <p>
              Current availability and market coverage are unverified. Dataset
              location labels mix geographic levels and do not imply nearby
              areas or state boundaries.
            </p>
          </details>
        </footer>
      </main>
    </>
  );
}
