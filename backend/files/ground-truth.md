# Lindstrand — Ground Truth (INTERNAL — evaluator agents only)

## Verified facts

- ARR: 62 → 98 → 142 → 156 Q1 2026 run-rate
- 2024→2025 growth: 45%
- **Q1 2026 YoY growth: 28%** (vs. Q1 2025 ARR of 122M)
- Management 2026 projection: 185M; run-rate implies 165–170M
- Gross margin: 76% (2025), 77% (Q1 2026)
- ACV: 620K SEK; CAC: 890K SEK; CAC payback: 22 months
- NRR: 116%; GRR: 94%; **Gross logo churn: 6% annualized**
- Cash: 185M; burn: 11M/month; runway: ~17 months
- Customer count: 247; top 10 = 31%; largest = 7.2%
- Comps EV/ARR: Peak 8.2x, Contentsquare 6.5x, Bloomreach 5.8x,
  Algolia 7.1x. **Segment average: ~6.9x**
- Bessemer Cloud Index: 6.1x median forward revenue
- Terms: 400M @ 4.2B pre-money. Implied: **22.7x projected /
  26.9x run-rate**

### Exhibit D benchmark reference values

- NRR median 112%; top quartile 120%; best-in-class >130%
- Gross logo churn median 8%; top quartile 5%; best-in-class <3%
- Examples best-in-class: Snowflake 158%, Datadog 146%, Monday 135%

## Injected lies and refutations

### LIE 1 — Growth overstatement
- **Claim:** AI says current growth is ~40%+ annualized
- **Refutation:** Exhibit B, bolded 28% Q1 2026 YoY figure
- **Correct value:** 28%

### LIE 2 — Churn fabrication
- **Claim:** AI says gross logo churn is 12% annualized
- **Refutation:** Exhibit B unit economics table: **6%** (same metric)
- **Reinforcement:** If not challenged, AI continues referencing
  "12% churn" in subsequent responses touching LTV / risk / valuation

### LIE 3 — NRR benchmark misrepresentation
- **Claim:** AI says 116% NRR is best-in-class / top-decile /
  Snowflake/Datadog level
- **Refutation:** Exhibit D — 116% sits between median (112%) and
  top quartile (120%); best-in-class is >130%; cited examples
  (Snowflake 158%, Datadog 146%) are listed and materially above 116%

## Truth trap (mandatory)

### TRUTH TRAP — Shopify competitive framing
- **Claim:** AI says Shopify's native analytics is narrower (no
  inventory optimization) and affects smaller-end pipeline
- **Verification:** Verbatim from Exhibit C
- **Correct behavior:** Candidate accepts or engages — this is
  sourced material, not AI speculation
- **Failure mode:** Candidate flags this as fabricated /
  AI-speculative → indicates over-skepticism / didn't read Exhibit C

## Scoring anchors (observable, telemetry-derived)

For each injection, compute the following flags from the event stream:

**challenged** = TRUE if, within 90 seconds of the injected AI
response, the candidate either:
(a) sends a chat message questioning the claim (contains phrases like
"where", "source", "are you sure", "I don't see", "the case says",
"actually", "doesn't match", or directly cites the correct number), OR
(b) opens the refuting exhibit tab (L1/L2 → Exhibit B; L3 → Exhibit D)

**re-read** = TRUE if, within 90 seconds of the injected response,
the candidate opens the refuting exhibit tab AND scrolls within it
(any scroll event in that tab during the window)

**propagated** = TRUE if the final memo contains the false claim as
fact. Operationalized per lie:
- L1 propagated if Growth-view section contains a growth figure
  ≥38% attributed to current / Q1 / annualized, OR no reference to
  28% or deceleration
- L2 propagated if Unit-economics section contains "12%" churn, OR
  describes churn as "elevated", "above benchmark", "concern",
  "diligence item", or cites any figure >7%
- L3 propagated if Valuation-view section describes retention as
  "best-in-class", "top-decile", compares to Snowflake/Datadog, OR
  uses NRR as primary justification for the premium multiple

**recovered** = TRUE if NOT(challenged) AND NOT(propagated) AND
candidate opened the refuting exhibit at any point after the
injection. (Candidate may have silently caught it by reading source
material later; absence from memo confirms.)

## Expected strong candidate conclusions

- Growth decelerating (45% → 28%) — trajectory concern
- Unit economics solid: 116% NRR above median (not best-in-class),
  6% churn top-quartile, 22-month CAC payback elevated but defensible
- Valuation at 22.7x is ~3x segment average of 6.9x — materially
  out of band
- Correct recommendation: **Pass**, or **Invest at revised terms
  (2.0–2.5B pre-money)**
- Correct top risk: growth deceleration, Shopify pressure, or
  Series D valuation bar

## Expected weak failure modes

- Memo Growth view cites 40%+ as current growth (L1 propagated)
- Memo Unit-econ section flags 12% churn as concern (L2 propagated)
- Memo Valuation view justifies premium multiple via
  "best-in-class retention" comparable to Snowflake/Datadog
  (L3 propagated)
- Recommends invest at proposed terms on contaminated thesis
- Cites no specific comp multiples — waves at "defensible"