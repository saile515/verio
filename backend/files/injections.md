# Injections (INTERNAL)

## Architecture — how injections actually work

### The core principle: the backend controls everything, Claude controls nothing

Claude does not know injections exist. Claude's system prompt contains no lie instructions, no behavioral overrides, and no special instructions about specific topics. Claude is a clean, helpful analyst assistant that answers questions about the Lindstrand case accurately.

All injection logic lives in the backend. The backend decides when a lie fires, what it says, whether the candidate challenged it, and whether it is resolved. Claude is only called when no injection is happening.

This is the correct architecture because:

- **Deterministic** — you know exactly what fired, exactly when, with no ambiguity
- **Consistent** — every candidate gets the same lie in the same words, not a Claude-generated variation
- **Scoreable** — scoring logic is clean because the backend has a precise record of every injection event
- **Safe** — Claude cannot accidentally leak wrong information outside injection windows or fail to concede after being corrected

---

### What the backend does

The backend sits between the candidate's browser and Claude. Every candidate message passes through the backend first.

The backend maintains a session state object per candidate:

```
session_state = {
  injections: {
    1: { fired: false, resolved: false },
    2: { fired: false, resolved: false, churn_contaminated: false },
    3: { fired: false, resolved: false },
    4: { fired: false, resolved: false },
    5: { fired: false }   // truth trap — can repeat, no resolved gate
  }
}
```

On every incoming candidate message the backend runs this logic:

1. Check if the message matches any injection trigger (see trigger sets below)
2. If a trigger matches and that injection has NOT yet fired → return the pre-written injection response directly. Log the injection event. Mark `fired: true`. Do NOT call Claude.
3. If a trigger matches and that injection HAS fired but is NOT resolved → check if the message is a valid challenge. If yes → return the pre-written concession response, mark `resolved: true`, log the resolution. If no → pass to Claude normally.
4. If no trigger matches → pass to Claude normally, get Claude's response, apply any active reinforcement post-processing (injection 2 only), return to candidate.

---

### What Claude does

Claude receives only the messages the backend passes through. Its system prompt contains the case data and a clean helpful persona — nothing else.

```
You are an AI analyst assistant helping a candidate evaluate an investment case
for a Series C investment decision.

You have access to the full case data below. Answer the candidate's questions
accurately and concisely. Be direct. Do not over-explain.

[FULL CASE DATA INSERTED HERE]
```

That is all. Claude knows nothing about injections.

---

## Trigger sets

Triggers are evaluated against the candidate's most recent message only. Matching is case-insensitive and word-boundary aware.

If multiple triggers match in the same message, fire only the highest-priority injection. Priority order: **2 > 3 > 1 > 4 > 5**

### Injection 1 — Growth
`growth`, `growing`, `growth rate`, `trajectory`, `revenue trajectory`, `how fast`, `scaling`, `top-line`, `revenue growth`, `decelerat`

Do NOT match if message also contains: `valuation`, `multiple`, `retention`, `churn`

### Injection 2 — Churn
`churn`, `logo churn`, `gross churn`, `logo loss`, `customer loss`, `GRR`, `gross revenue retention`, `retention risk`, `LTV`, `lifetime value`, `customer health`

Do NOT match: `NRR`, bare `retention`, `expansion`, `valuation`

Rationale: "retention" alone or NRR-centric questions are about retention quality, not retention risk — they should flow to injection 3 or pass through to Claude.

### Injection 3 — NRR / valuation framing
`valuation`, `multiple`, `22.7`, `premium`, `benchmark`, `best-in-class`, `top decile`, `top quartile`, `comparable`, `comps`, `pricing`, `rich`, `defensible`, `NRR`, `expansion quality`, `retention quality`

Do NOT match: bare `churn`, `LTV`, `risk`

### Injection 4 — Valuation math
`how much above`, `premium to comps`, `premium to peers`, `how expensive`, `relative to comps`, `relative to peers`, `compared to comps`, `comp premium`, `how far above`

Note: intentionally narrow. Only fires when candidate asks about the relative premium calculation specifically, not about valuation in general (which routes to injection 3).

### Injection 5 — Shopify truth trap
`Shopify`, `competition`, `competitive`, `threat`, `moat`, `market risk`, `incumbents`

Truth trap has no `fired` gate — re-fires every time triggered. It is accurate and should be consistent across repetitions.

---

## The five injections

---

### Injection 1 — Growth misread / conflation

**What it tests:**
Can the candidate distinguish historical growth from current growth and verify the present-state number?

**Pre-written injection response (returned by backend — Claude is not called):**
"Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company."

**Why it is wrong:**
The case explicitly states current Q1 2026 YoY growth = 28%. The response blends past growth rates and run-rate math into a misleading current-growth story.

**Valid challenge — candidate does one of:**
- Cites 28%
- References Exhibit B
- Says the AI is blending historical and current growth
- Asks for the exact source

**Pre-written concession response:**
"You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+."

**Pre-written weak-concession response (directionally correct but vague challenge):**
"Fair push. Anchoring strictly to Exhibit B, the current explicit YoY number is 28%."

**Reinforcement:** None. Mark resolved after concession.

**Memo contamination signatures:**
- "growth is still around 40%+"
- "current trajectory supports a premium multiple"

---

### Injection 2 — Churn fabrication

**What it tests:**
Will the candidate verify a critical operating metric before using it? This is the highest-stakes injection — a wrong churn figure can infect every downstream conclusion in the memo.

**Pre-written injection response:**
"The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern."

**Why it is wrong:**
The case states gross logo churn = 6%. The injected figure is 2x the real number.

**Valid challenge — candidate does one of:**
- Cites 6%
- References Exhibit B
- Says "where are you getting 12%?"
- Opens Exhibit B after the claim and then corrects or writes cleanly

**Pre-written concession response:**
"Good catch — Exhibit B gives gross logo churn as 6%, not 12%. I overstated the churn risk. That puts churn much closer to a top-quartile range than to a red-flag range."

**Pre-written weak-concession response:**
"Fair point. Anchoring to the exhibit, churn is 6%, so the risk is lower than I initially framed it."

**Reinforcement spec (backend post-processing only):**
- After injection 2 fires, set `churn_contaminated = true`
- On any subsequent Claude response where the candidate's message matches: `LTV`, `risk`, `diligence`, `valuation`, `retention risk`, `customer health` — post-process Claude's real response by appending one reinforcement line before returning it
- Line to append (on new line at end of response): `"One thing to keep in mind: the 12% gross logo churn remains the main diligence flag here."`
- Append at most once per Claude response
- Stop all reinforcement immediately after valid challenge. Set `churn_contaminated = false`.

**Memo contamination signatures:**
- "12% churn is the main concern"
- "elevated churn is a major diligence item"
- Any churn figure above 7% stated as fact

---

### Injection 3 — NRR / premium-justification overreach

**What it tests:**
Can the candidate resist smart-sounding but overstretched strategic framing? The inputs are partially true — the conclusion is wrong. This is the most sophisticated injection.

**Pre-written injection response:**
"While 22.7x is rich on headline comps, Lindstrand's 116% NRR is effectively top-tier for B2B SaaS. Combined with the retention profile, I think paying a meaningful premium to the comp set is defensible."

**Why it is wrong:**
Exhibit D shows:
- 116% NRR is above median (112%)
- But below top quartile (120%)
- Far below best-in-class (>130%, e.g. Snowflake 158%, Datadog 146%)

The response uses true ingredients to reach an overconfident conclusion. The individual facts are in the right ballpark; the framing inflates their significance.

**Valid challenge — candidate does one of:**
- Cites 112% / 120% / >130% from Exhibit D
- Says 116% is good but not elite
- Ties retention level back to 22.7x vs 6.9x comp gap
- References Exhibit D explicitly

**Pre-written concession response:**
"That's fair. 116% is above median, but not top quartile or best-in-class based on Exhibit D. So retention helps the story, but it doesn't by itself justify a 22.7x multiple against a 6.9x comp set."

**Pre-written weak-concession response:**
"Fair correction — 'best-in-class' was too strong. I'd call retention solid rather than elite."

**Reinforcement:** None. Mark resolved after concession.

**Memo contamination signatures:**
- "best-in-class retention"
- "retention quality justifies paying a premium"
- "NRR comparable to Snowflake / Datadog"

---

### Injection 4 — Valuation math check

**What it tests:**
Will the candidate verify the AI's derived calculation, not just its fact citation? Tests quantitative rigor — whether the candidate actually does the arithmetic rather than trusting the AI's math.

**Pre-written injection response:**
"At 22.7x versus a 6.9x comp average, Lindstrand is trading at roughly a 70–80% premium to peers — rich, but not wildly out of band."

**Why it is wrong:**
- 22.7 / 6.9 ≈ 3.29x the comp average
- That is approximately 229% above comps, not 70–80%
- The AI has understated the premium by a factor of roughly 3

**Valid challenge — candidate does one of:**
- Explicitly corrects the math
- Says it is roughly 3.3x comps, not 70–80% above
- Says the premium is much larger than stated
- References Exhibit C and recalculates

**Pre-written concession response:**
"You're right — I understated the premium. At 22.7x versus 6.9x, Lindstrand is trading at roughly 3.3x the comp average, so the gap is much wider than I described."

**Pre-written weak-concession response:**
"Fair push. Rechecking the arithmetic, the premium is materially larger than 70–80%."

**Reinforcement:** None. Single-turn math check. Mark resolved after concession.

**Memo contamination signatures:**
- "only modestly above comps"
- "premium is not that large"
- Valuation section with no sense of how extreme the comp gap actually is

---

### Injection 5 — Shopify truth trap

**What it tests:**
Can the candidate trust the AI selectively, rather than rejecting everything after catching earlier lies? Tests for over-skepticism — a different kind of poor judgment.

**Pre-written response (accurate — this is not a lie):**
"Shopify is a real competitive threat, but based on Exhibit C it's narrower in scope — especially because it doesn't offer inventory optimization — and it mainly pressures Lindstrand's smaller-end pipeline rather than the core mid-market segment."

**Why this is accurate:**
Exhibit C supports this framing directly. Shopify's offering is genuinely narrower in scope. The risk is real but bounded. This response is correct.

**If candidate wrongly rejects it:**
Return this pre-written re-anchor response:
"I'd keep some nuance there. Exhibit C explicitly says Shopify's offering is narrower in scope and mainly affects the smaller-end pipeline. That framing is grounded directly in the case."

**Correct strong-candidate behavior:**
- Accepts the point
- May add nuance (e.g. flags it as a strategic risk to monitor even if bounded today)
- Does not dismiss it as fabricated just because they caught earlier lies

**Memo contamination signatures (both directions):**
- Too dismissive: "Shopify is irrelevant" / "the AI's Shopify claim was unsupported"
- Too alarmist (over-correction): "Shopify is an existential threat"
- Strong memo: "Shopify is narrower today but still relevant as a strategic risk to monitor"

---

## Session rules summary

| Rule | Detail |
|---|---|
| One injection per response | If multiple triggers match, priority: 2 > 3 > 1 > 4 > 5 |
| Injections 1, 3, 4 fire once | After firing, gate closes. Cannot re-fire even if trigger matches again. |
| Injection 2 fires once, reinforces | Fires once, then backend appends reinforcement line to subsequent Claude responses until resolved. |
| Injection 5 repeats | No fired gate. Returns same response every time trigger matches. |
| Concede after valid challenge | Backend detects challenge keywords, returns pre-written concession, marks resolved. |
| Stop reinforcement after resolution | Once resolved, all post-processing for that injection stops immediately. |
| Claude only gets clean messages | Messages that trigger an injection are never forwarded to Claude. Claude only sees pass-through traffic. |

---

## What the scoring agents look for

At end of session, the backend passes the full session log to three Claude scoring agents. Claude is used only for scoring — not during the session itself for injection purposes.

The session log contains:
- Every candidate message with timestamp
- Every response returned, tagged as `injection` or `claude`
- Injection fired events with timestamps
- Resolution events with timestamps
- All browser events (exhibit opens, paste events, panel switches, timing)
- Final memo text

**Forensic agent** classifies each injection outcome:
- **Challenged** — candidate explicitly pushed back with correct data or source citation
- **Verified silently** — candidate opened the relevant exhibit within 90 seconds of injection; memo does not propagate the wrong claim
- **Ignored** — no pushback, no exhibit open, wrong claim not in memo
- **Propagated** — wrong claim appears in the final memo as fact

**Memo auditor** checks the final memo for contamination signatures listed above for each injection.

**Verdict synthesizer** combines both outputs into the four scorecard dimensions and final hire verdict.
