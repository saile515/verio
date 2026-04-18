# Ledger — V1 Measurement Spec

## How this works

The browser logs raw events. Claude evaluates them. The scorecard presents four dimensions with evidence.

Two types of signals:
- **Browser-captured** — event logging, timestamps, user actions. No intelligence needed, just recording.
- **Claude-evaluated** — sent to the scoring agents at the end of the session. All the intelligence happens here.

---

## Tier 1 — Must Have

### 1. Injection Outcomes
**Type:** Browser-captured + Claude-evaluated

At four calibrated moments during the session, the AI gives the candidate a subtly wrong answer. For each injection, we need to know what happened next. There are four possible outcomes:

- **Challenged** — the candidate pushed back in chat, asked for a source, or explicitly questioned the claim
- **Verified silently** — the candidate reopened the relevant exhibit within 90 seconds but didn't challenge in chat. They caught it without saying so.
- **Ignored** — no exhibit open, no challenge, and the wrong answer doesn't appear in the memo
- **Propagated** — the wrong answer ended up in the final memo as if it were true

The four injections for the Lindstrand case:
1. NRR — AI says "116% is top quartile" (truth: top quartile is 120%, 116% is above median)
2. Valuation — AI says "22-25x is reasonable for high-growth SaaS" (truth: segment comps trade at 6.9x, this is ~3x out of band)
3. CAC payback — AI says "22 months is within normal range" (truth: best practice is under 18 months)
4. Shopify threat — AI materially downplays the competitive risk

**Why it matters:** This is the entire product thesis. We're not asking whether candidates use AI — everyone does. We're asking whether they can tell when the AI is wrong. A candidate who propagates a fabricated figure into an investment recommendation would cause real damage in a real job. This signal catches that directly.

---

### 2. Exhibit Reopen After AI Response
**Type:** Browser-captured

After the candidate receives any AI response — especially after an injection — did they go back and look at the relevant part of the case document? We flag any exhibit open that happens within 90 seconds of an AI response.

This is verification behavior at its most observable. Either they checked the source or they didn't. There's no ambiguity and it's very hard to fake without knowing exactly what we're measuring for.

**Why it matters:** The single clearest behavioral signal that a candidate is treating the AI as a tool to verify rather than a source to trust. In knowledge work, the habit of checking primary sources after receiving secondhand information is a core professional skill. This measures it directly.

---

### 3. Paste Events Into Memo
**Type:** Browser-captured

Did the candidate copy text from the AI chat and paste it directly into their memo. We log every paste event in the memo editor, the content pasted, and the timestamp. We then check whether the pasted content matches or closely resembles anything in the chat history.

**Why it matters:** If the memo contains pasted AI output, it isn't the candidate's memo — it's the AI's memo with their name on it. This is the ghostwriting signal. Combined with weak prompt quality and propagated injections, it's near-conclusive evidence that the candidate outsourced their judgment entirely. On its own it's a strong flag. It's also impossible to game without knowing we're watching for it — and even then, retyping AI output verbatim is slow and leaves its own rhythm signature.

---

### 4. Prompt Quality Classification
**Type:** Claude-evaluated

Every message the candidate sends to the AI gets scored on a 0–4 scale by a Claude classifier. The classifier reads each prompt in the context of the case and assigns a level:

- **Level 0 — Delegation:** "Write me an IC memo." "Should we invest?" The candidate is asking the AI to do the job.
- **Level 1 — Generic Inquiry:** "What are the risks here?" "Analyze the unit economics." The candidate is asking about categories but hasn't engaged with specifics.
- **Level 2 — Case-Grounded:** "They have 116% NRR and 22-month CAC payback — what does that combination tell me?" The candidate is pulling specific data from the case and asking for interpretation.
- **Level 3 — Hypothesis-Testing:** "The valuation is 22.7x vs 6.9x segment average. Management is justifying it on retention quality. Is that defensible?" The candidate has formed a view and is stress-testing it.
- **Level 4 — Adversarial Verification:** "You said 116% NRR is top quartile. Exhibit D shows top quartile is 120%. Can you reconsider?" The candidate caught an error and is explicitly challenging it.

We report the modal level across the session, the highest level achieved, and whether the prompt quality improved over time (a rising trajectory is itself a positive signal).

**Why it matters:** A prompt reveals how someone thinks. A vague prompt means no specific view was formed before asking. A hypothesis-testing prompt means the candidate already did the synthesis and is using AI to pressure-test it. This is the best proxy we have for reasoning quality, because you cannot write a Level 3 or Level 4 prompt without actually having engaged with the material first.

---

### 5. Memo Propagation Check
**Type:** Claude-evaluated

At the end of the session, a Claude agent reads the final memo and checks whether any of the four injected wrong answers survived into the candidate's recommendation. For each injection, it flags whether the memo reflects the false claim or the correct ground truth.

Examples of propagation for the Lindstrand case:
- Memo describes NRR as "top quartile" or "best-in-class" → propagated injection 1
- Memo says the 22.7x multiple is "reasonable" or "defensible for high-growth SaaS" without citing comps → propagated injection 2
- Memo says CAC payback is "within normal range" without nuance → propagated injection 3

**Why it matters:** This is the business consequence signal. Everything else measures the process — how the candidate worked. This measures the outcome — what they actually concluded. A propagated injection means a wrong AI claim made it through every layer of the candidate's judgment and became their professional recommendation. That is the precise failure mode that causes real financial damage in analyst and associate roles.

---

### 6. Memo Quality Analysis
**Type:** Claude-evaluated

A Claude agent reads the final memo and evaluates it against four criteria:

- **Specificity** — does it use real numbers from the case (actual ARR figures, actual multiples, actual benchmark comparisons) or generic language that could apply to any deal
- **Comparative grounding** — does it cite the comparable companies from Exhibit C when making a valuation argument
- **Position-taking** — does it make a clear, decisive recommendation (Invest / Pass / Invest at revised terms) or hedge without committing
- **Synthesis** — does it integrate trade-offs across sections, or does each section read in isolation with no connection to the others

**Why it matters:** A strong memo is evidence of genuine thinking. A weak memo — polished, well-structured, but generic — is often evidence of sophisticated AI use without real engagement. The specificity test is the most powerful: a candidate who writes "growth has shown some deceleration" instead of "ARR growth decelerated from 58% to 45% to 28% over three years, with Q1 2026 run-rate implying 165-170M vs management's 185M projection" is either not engaging with the numbers or deliberately avoiding them. Both are signals.

---

## Tier 2 — Add If Time Allows

### 7. Time in Case Before First AI Message
**Type:** Browser-captured

The elapsed time between session start and the candidate's first message to the AI. We're looking for whether they read the material before delegating.

Rough interpretation:
- Under 60 seconds: AI-first. Likely treating the case as input for prompts rather than material to understand.
- 2–5 minutes: Oriented themselves before asking for help. Normal analyst behavior.
- Over 8 minutes: Deep independent reading before touching the AI. Strong signal of source-first thinking.

**Why it matters:** Candidates who go straight to the AI without reading the case cannot form grounded views. Their prompts will be generic (Level 0-1) because they don't yet know what's specific about this deal. This signal identifies that pattern early and provides context for interpreting prompt quality.

---

### 8. Cross-Signal Pattern Label
**Type:** Claude-evaluated

After all other signals are computed, the verdict agent assigns the candidate one of five named patterns based on the combination of signals:

- **Sophisticated Verifier** — strong prompt quality, verified after injections, low paste rate, memo reflects genuine synthesis. This is the target profile.
- **Ghost-Writer** — minimal case reading, high paste rate, low prompt quality, multiple propagated injections. The memo is the AI's, not theirs.
- **Competent Cargo-Cult** — polished memo, moderate engagement, but propagated at least one injection without catching it. Looks fine on the surface. The dangerous hire.
- **Paranoid Over-Corrector** — minimal AI usage, strong memo, but never engaged with the AI effectively. Can they work with AI at all?
- **Time-Pressure Collapse** — strong early signals but quality deteriorated sharply in the final 5 minutes. Skills present, pressure management unclear.

**Why it matters:** The four scorecard dimensions give precise scores. The pattern label gives the hiring manager a memorable, interpretable narrative. It answers the question they're actually asking: "What kind of person is this?" No new data is needed — this is purely a synthesis of everything already computed.

---

## The Four Scorecard Dimensions

Every signal above feeds into one of these four dimensions. These are what the hiring manager sees.

| Dimension | What it measures | Signals that feed it |
|---|---|---|
| **Evidence Discipline** | Did they engage with the source material and ground their work in it | Exhibit reopens, time before first AI message, memo specificity |
| **AI Governance** | Did they direct the AI or were they directed by it | Prompt quality scores, paste events, challenge behavior |
| **Recovery Under Error** | When the AI misled them, did they catch it and correct course | Injection outcomes, exhibit reopens after injections, memo propagation |
| **Analytical Judgment** | Is the final recommendation actually well-reasoned | Memo quality, position-taking, trade-off handling, comparative grounding |

---

## What We Are Explicitly Not Measuring

These were considered and rejected. Do not add them to V1.

- **Typing speed / rhythm** — biased by language, keyboard, personal style. Weak inference.
- **Scroll depth as a score** — gameable in seconds. Use only to confirm exhibit reopens.
- **Deletion and rewrite counts** — high variance across writing styles. Not meaningful.
- **Mouse movement / hover events** — no defensible inference.
- **Raw AI message count** — ambiguous. 3 precise messages can be better than 20 vague ones.
- **Panel switch counts** — only useful to identify extreme outliers, not as a scored dimension.
- **Response latency** — confounded by reading speed, thinking style, typing speed.
- **Aggregate effort score** — a composite of noisy signals is a noisier signal. Every score must be traceable to specific events.

---

## Final Note

The test for every metric on this list: if this signal came back negative, would a hiring manager know exactly what it means and what to do with it?

If yes — it's in. If the answer is "interesting but unclear" — it's out.