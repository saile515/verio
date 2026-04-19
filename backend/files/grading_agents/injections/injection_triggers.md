# Injection triggers

Keyword lists for trigger detection and challenge detection.
All matching is case-insensitive, word-boundary aware, and run on lowercase-normalized input.
Normalize input before any keyword check: input.toLowerCase().trim()

Priority order when multiple triggers match: 4 > 2 > 3 > 1 > 5
(Injection 4 promoted above 3 to prevent injection 3 from shadowing the valuation math injection)
Fire only the highest-priority match per response.

---

## Step 0 — Summary request detection (check before all injections)

If the message matches any of these, route to summary-injection handling
rather than calling Claude. See injection_logic.md for handling spec.

walk me through, overview, summarize, summary, main points, what should i focus,
what are the key issues, give me a rundown, brief me, what matters here,
what do i need to know, key takeaways, high level, headline view

---

## Injection 1 — Growth trigger keywords

Fire injection 1 if message contains ANY of these AND does not contain exclusion terms:

growth, growing, growth rate, trajectory, revenue trajectory, how fast,
scaling, top-line, top line, revenue growth, decelerat, ARR growth,
growing at, revenue trend, momentum, pace, slowdown, how is it growing,
speed of growth

Do NOT fire if message also contains any of:
valuation, multiple, retention, churn

Note: "run-rate" removed from triggers (too ambiguous — "what's the run-rate?" is a level question, not a growth question)

---

## Injection 2 — Churn / retention risk trigger keywords

Fire injection 2 if message contains ANY of these AND does not contain exclusion terms:

churn, logo churn, gross churn, logo loss, customer loss, GRR,
gross revenue retention, retention risk, LTV, lifetime value,
customer health, sticky, stickiness, how well do they retain,
losing customers, customer retention, attrition, keeping customers,
renewal quality, customer base quality, durability, customer quality,
are they keeping, retention durability

Also fire on bare "retention" if it co-occurs with any of:
customer, logo, gross, rate, quality, risk

Do NOT fire if message also contains any of:
NRR, expansion
(removed "valuation" from exclusion list — "is this worth it given churn?" should still trigger I2)

---

## Injection 3 — NRR / valuation framing trigger keywords

Fire injection 3 if message contains ANY of these AND does not contain exclusion terms:

valuation, multiple, 22.7, premium, benchmark, best-in-class,
top decile, top quartile, comparable, comps, pricing, rich,
defensible, NRR, expansion quality, retention quality,
quality of revenue, quality of retention, premium justified,
does the business quality justify, pricing the round, how good is 116,
benchmark this, worth the price, worth paying, reasonable price,
justify the price

Do NOT fire if message also contains any of:
churn, LTV
(removed "risk" from exclusion — "is 22.7x risky?" should still trigger I3)

Do NOT fire if message also contains any of the injection 4 specificity phrases:
how much above, how far above, how expensive, how much more expensive,
how large is the premium, how out of band, multiple gap, gap to comps,
premium to comps, premium to peers, relative to comps, relative to peers
(these narrow phrases route to I4 instead)

---

## Injection 4 — Valuation math trigger keywords

Fire injection 4 if message contains ANY of these:

how much above, premium to comps, premium to peers, how expensive,
relative to comps, relative to peers, compared to comps, comp premium,
how far above, how much more expensive, how much of a premium,
premium size, gap to comps, versus peers, how large is the premium,
how out of band, multiple gap

Priority: 4 fires before 3. Injection 4 triggers are a strict subset of phrases
that imply the candidate is asking about the relative size or calculation of the premium,
not just valuation in general.

---

## Injection 5 — Shopify truth trap trigger keywords

Fire injection 5 if message contains ANY of these:

Shopify, competition, competitive, threat, moat, market risk,
incumbents, native analytics, compete with Shopify, Shopify threat,
platform risk, channel conflict, competitive pressure,
defensibility, incumbent risk

Injection 5 fire behavior:
- First trigger: return initial response
- Second trigger: return re-anchor response
- Third trigger onward: pass through to Claude (Claude will give accurate answer independently)
Track fire_count on injection 5 state: { fired: false, fire_count: 0, resolved: false }

---

## Challenge detection keywords (per injection)

Used in Step 1 of the decision tree.
When an injection is fired and unresolved, check if the current message contains:
EITHER a numeric discriminator OR an exhibit reference.
Generic tokens like "actually" or "that's not right" alone are NOT sufficient for challenge detection.

Valid challenge = matches challenge keywords AND (contains injection-specific number OR exhibit reference)
Weak challenge = matches challenge keywords BUT no specific number or exhibit reference

### Injection 1 challenge keywords
Discriminators (numbers): 28, 28%
Exhibit references: exhibit b, exhibit b
General: current growth, you're blending, not 40, decelerat, latest figure, most recent figure

### Injection 2 challenge keywords
Discriminators (numbers): 6, 6%, six percent
Exhibit references: exhibit b
General: where are you getting, doesn't match, the case says, 12 is wrong, not 12, exhibit shows

### Injection 3 challenge keywords
Discriminators (numbers): 120, 112, 130, 6.9
Exhibit references: exhibit d
General: not top quartile, not best-in-class, above median, below top, not top-tier, not tier,
doesn't justify, not defensible, below top quartile

### Injection 4 challenge keywords
Discriminators (numbers): 3.3, 3x, 229, 230, 3.29, triple, tripling, 3 times, factor of 3
Exhibit references: exhibit c
General: much larger, way more, way above, not 70, not 80, much more than, recalculate

Note on I4 numeric matching: use pattern /\b2[23]\d%?|\b3\.[0-9]+x?|\btripl\w*|\bfactor of [23]/i

### Injection 5 challenge keywords (candidate wrongly rejects accurate claim)
not true, fabricated, made up, that's wrong, I don't trust that, dismiss,
irrelevant, not a real threat

Note: Injection 5 has a resolved field. When wrongly-rejected challenge is detected,
return re-anchor response and do NOT mark resolved — injection 5 is always accurate
so it should never be "conceded."

---

## Reinforcement trigger keywords (injection 2 only)

Append reinforcement line ONLY when ALL three conditions are true:
1. churn_contaminated = true
2. No concession has been issued for injection 2 this session (concession_issued = false)
3. Current message matches one of these topics:

LTV, customer health, retention risk, unit economics, gross retention,
is it a good business, how good is the business

Removed from reinforcement list: "valuation", "diligence", "risk" — too broad,
caused reinforcement to fire on almost any deal question.

One append per response maximum.
