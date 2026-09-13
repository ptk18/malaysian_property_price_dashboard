# Demo design system

Read this document before changing the UI. The system prioritizes readable filters, visible tradeoffs, and predictable navigation.

## Product hierarchy

Make Shortlist the default tab and Analytics the second tab. The main sequence is brief input, editable filters, results, and comparison; the primary action at each step should make the next decision obvious. Keep model names, API details, quota storage, and implementation explanations out of the main product flow unless needed to explain an actionable error.

Show a concise dataset note: Malaysian advertised listings, MYR, square feet, and dataset-location labels that have not been fully geographically standardized. Availability and current market coverage are unverified.

## Visual foundations

- Use a light neutral background, white surfaces, dark slate text, and one blue primary-action color.
- Core tokens: background `#F8FAFC`, surface `#FFFFFF`, primary text `#0F172A`, secondary text `#475569`, border `#CBD5E1`, primary action `#1D4ED8` with white text, warning text `#92400E` on `#FFFBEB`, error text `#B91C1C` on `#FEF2F2`.
- Use a system sans-serif stack, a 16px base font, and tabular numerals for prices and counts. Keep headings and body text restrained and readable.
- Use a consistent 4px spacing scale, 8–12px corner radii, and subtle borders. Avoid decorative animation and unnecessary imagery.
- Verify contrast for final color combinations; do not rely on color alone for match quality, errors, selections, or chart meaning.

## Form and result patterns

Give every field a persistent visible label and actionable validation text. Label budget as a target and display the calculated ±10% range; show the ±1 bedroom range alongside the confirmed bedroom count. Location and property type use searchable or native controls limited to supported dataset labels.

Separate Extract filters from Find properties. Keep extracted fields editable and show review notes near the affected controls. A hard-cap phrase in the brief must prompt review of the target-budget interpretation before search confirmation.

Result cards show the building name or `Unnamed property`, location, type, asking price, size, and bedroom count. Use factual badges such as `Exact bedrooms`, `1 fewer bedroom`, or `8% above target`; do not invent a confidence percentage or imply a recommendation is financially sound. Keep selection controls in a consistent position and explain the three-property maximum.

Comparison aligns the same facts across up to three properties, with persistent property names and remove actions. On narrow screens use labeled stacked sections or a clearly scrollable comparison region with readable headers. Do not shrink text to force the desktop layout onto mobile.

## Analytics patterns

Label the tab `All listings` in its scope description. Show total listings and median asking price before the charts, and use `Dataset location` for the grouping label. Use a histogram for asking-price distribution and readable bars or a compact numeric listing for location count/median comparisons.

Always include currency, units, axis labels, and a readable numeric alternative to chart-only information. If the existing histogram combines the top price tail into an overflow bucket, label it explicitly and do not imply that its width equals an ordinary bin. Do not label building-completion-year relationships as market price trends.

## Interaction and accessibility

- Support keyboard navigation, visible focus, semantic buttons, labeled inputs, and properly associated errors.
- Keep interactive targets approximately 44px high where practical and preserve sufficient spacing.
- Announce asynchronous results and errors without unexpectedly moving focus; manage and restore focus if comparison uses a modal.
- Design and inspect at approximately 390px and 1440px widths. Prevent whole-page horizontal overflow; a labeled comparison region may scroll intentionally.
- Preserve user input after recoverable errors. Show concise loading feedback, an actionable empty state, and a manual-entry fallback when AI extraction is unavailable.
- Format money consistently as `RM` with thousands separators and units as `sq ft`; show missing values as `Not available`, never zero.

## Scope discipline

No login screen, chat interface, property imagery pipeline, map, branding exercise, or AI-generated comparison text is needed for this MVP. Prioritize clear filters, visible tradeoffs, and a complete working path over extra surfaces.
