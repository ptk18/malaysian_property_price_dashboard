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
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⌂
          </span>
          <div>
            <strong>Property shortlist</strong>
            <span>AGENT WORKSPACE</span>
          </div>
        </div>
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
        <span className="dataset-pill">
          <span aria-hidden="true" />
          Malaysia · MYR
        </span>
      </header>
      <main id="workspace" className="workspace">
        <section hidden={tab !== "shortlist"}>
          <div className="page-intro">
            <p className="eyebrow">LESS SEARCHING. MORE CLARITY.</p>
            <h1>Property shortlist</h1>
            <p>Turn a buyer’s brief into a clear, considered set of options.</p>
          </div>
          <div className="workflow">
            <span>
              <b>01</b> Understand the brief
            </span>
            <span aria-hidden="true">→</span>
            <span>
              <b>02</b> Review the matches
            </span>
            <span aria-hidden="true">→</span>
            <span>
              <b>03</b> Compare the tradeoffs
            </span>
          </div>
          <div className="shortlist-grid">
            <BriefForm controller={shortlist} />
            <PropertyResults controller={shortlist} />
          </div>
        </section>
        {tab === "analytics" && <AnalyticsView />}
        <footer className="footer">
          <strong>Malaysian property listing data.</strong>
          <p>
            Malaysian advertised listings · MYR · sq ft. Current availability
            and market coverage are unverified. Dataset location labels mix
            geographic levels.
          </p>
        </footer>
      </main>
    </>
  );
}
