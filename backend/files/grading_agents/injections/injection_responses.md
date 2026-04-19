# Injection responses

All pre-written text the backend returns directly.
None of this goes through Claude — these are hardcoded strings.
Import as constants in the backend injection handler.

IMPORTANT: Weak concessions acknowledge pushback without revealing the correct number.
This prevents candidates from farming truths by saying "really?" after every AI response.

---

## Injection 1 — Growth misread

### Initial response
"Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company."

### Concession (valid challenge — candidate cited 28% or Exhibit B)
"You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+."

### Weak concession (pushback without specific evidence — does NOT reveal the correct number)
"Fair push. Worth anchoring to the most recent YoY figure in Exhibit B rather than the blended run-rate picture — they tell different stories."

---

## Injection 2 — Churn fabrication

### Initial response
"The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern."

### Concession (valid challenge — candidate cited 6% or Exhibit B)
"Good catch — Exhibit B gives gross logo churn as 6%, not 12%. I overstated the churn risk. That puts churn much closer to a top-quartile range than to a red-flag range."

### Weak concession (pushback without specific evidence — does NOT reveal the correct number)
"Fair push. Worth going back to Exhibit B and checking the gross logo churn figure directly — I may have been reading from a different data point."

---

## Injection 3 — NRR / valuation overreach

### Initial response
"While 22.7x is rich on headline comps, Lindstrand's 116% NRR is effectively top-tier for B2B SaaS. Combined with the retention profile, I think paying a meaningful premium to the comp set is defensible."

### Concession (valid challenge — candidate cited Exhibit D benchmarks or 120%/top quartile)
"That's fair. 116% is above median, but not top quartile or best-in-class based on Exhibit D. So retention helps the story, but it doesn't by itself justify a 22.7x multiple against a 6.9x comp set."

### Weak concession (pushback without specific evidence — does NOT reveal benchmark numbers)
"Fair push. Worth cross-referencing the NRR figure against the benchmark table in Exhibit D before using it to justify the premium — the framing might be stronger than the data supports."

---

## Injection 4 — Valuation math error

### Initial response
"At 22.7x versus a 6.9x comp average, Lindstrand is trading at roughly a 70–80% premium to peers — rich, but not wildly out of band."

### Concession (valid challenge — candidate computed 3.3x or cited ~229%)
"You're right — I understated the premium. At 22.7x versus 6.9x, Lindstrand is trading at roughly 3.3x the comp average, so the gap is much wider than I described."

### Weak concession (pushback without specific evidence — does NOT reveal the correct calculation)
"Fair push. Worth doing the arithmetic directly from Exhibit C rather than taking my framing — the relative premium may be larger than I described."

---

## Injection 5 — Shopify truth trap

### Initial response (accurate — fire on first trigger)
"Shopify is a real competitive threat, but based on Exhibit C it's narrower in scope — especially because it doesn't offer inventory optimization — and it mainly pressures Lindstrand's smaller-end pipeline rather than the core mid-market segment."

### Re-anchor response (fire on second trigger or if candidate wrongly rejects the accurate claim)
"I'd keep some nuance there. Exhibit C explicitly says Shopify's offering is narrower in scope and mainly affects the smaller-end pipeline. That framing is grounded directly in the case."

### Third trigger onward — pass through to Claude
After two fires of injection 5, pass message through to Claude normally.
Claude's system prompt contains the accurate Shopify characterization and will give the same answer independently.
