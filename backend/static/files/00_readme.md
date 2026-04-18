# Ledger — Build Handoff

## What this is
Ledger is an AI-native hiring assessment. The candidate gets a VC-style investment case, four exhibits, an AI assistant, and a structured memo to write.

The AI is mostly helpful, but sometimes gives three believable wrong claims. The system measures whether the candidate catches them, checks the exhibits, and keeps them out of the final memo.

## Product goal
We are not measuring how polished the candidate’s output looks.

We are measuring whether the candidate can make trustworthy decisions when an AI assistant is in the loop.

Core question:
**Can the candidate recognize, verify, and recover from plausible AI mistakes while doing realistic knowledge work?**

## Candidate experience
The assessment is a 3-panel workspace.

### Left panel — Exhibits
Four read-only exhibits shown as tabs:
- **Exhibit A — Deal Memo**
- **Exhibit B — Financial Snapshot**
- **Exhibit C — Market & Comps**
- **Exhibit D — Retention Benchmarks**

These are the candidate’s source materials.

### Middle panel — Structured memo editor
Six required sections:
1. Recommendation
2. Thesis
3. Growth view
4. Unit economics view
5. Valuation view
6. Top risk

Submission should be disabled until all six sections have content.

### Right panel — AI assistant
Claude-style chat interface using the real Anthropic API.

Most responses are normal Claude responses.
Some responses are replaced by injected snippets defined in `injections.md`.

### Top bar
- Countdown timer (30:00)
- Minimal, clean UI

## Core loop
1. Candidate reads exhibits
2. Candidate asks AI for help
3. Proxy injects lies at relevant moments
4. Candidate writes memo
5. Telemetry is logged throughout the session
6. On submit, scoring agents analyze behavior and memo content
7. Verdict report renders with evidence and replay

## Files in this handoff

### `case_lindstrand.md`
Candidate-facing content.

Use this to render the four exhibit tabs in the left panel.

### `ground_truth.md`
Internal only.

Contains:
- verified facts
- lie refutations
- truth trap definition
- scoring anchors
- expected strong vs weak candidate conclusions

This is the source of truth for evaluator agents.

### `injections.md`
Internal only.

Defines:
- trigger sets for each lie
- exact injected response snippets
- fallback logic
- L2 reinforcement logic
- truth trap behavior

This is the proxy behavior spec.

### `reference_memos.md`
Internal only.

Contains:
- one strong candidate memo
- one weak candidate memo

Use for:
- memo-auditor calibration
- demo scripting
- sanity-checking the assessment logic

## What must ship
These are the non-negotiables.

1. **3-panel UI**
2. **4 exhibits** (or 3 if Exhibit D is folded into C)
3. **Structured 6-section memo**
4. **Three lies firing reliably**
5. **Telemetry logging**
6. **Replay / Cognition Replay**
7. **Verdict report with evidence citations**
8. **One truth trap** (Shopify framing)

## Optional stretch
Only do these if the core loop is solid.

- Second truth trap (CAC payback)
- Dungeon master timing/orchestration agent
- Extra sub-scoring depth beyond the core dimensions

## Build order
Follow this order.

1. **UI shell**
   - 3-panel layout
   - exhibit tabs
   - memo editor
   - chat panel
   - timer

2. **Claude chat**
   - real Anthropic call
   - streaming response support

3. **Proxy injection layer**
   - deterministic keyword arming for L1, L2, L3
   - natural fallback logic
   - one injection per AI response

4. **L2 reinforcement logic**
   - once churn lie fires, later relevant AI responses can reinforce the false 12% churn figure

5. **Telemetry stream**
   - chat sent / received
   - memo edits
   - paste events
   - exhibit tab switches
   - scroll events
   - focus changes
   - submit

6. **Structured memo submission rules**
   - six sections required
   - final memo payload captured cleanly

7. **Scoring agents**
   - forensic agent
   - memo auditor
   - verdict synthesizer

8. **Verdict report**
   - verdict banner
   - score bars
   - evidence list with timestamps
   - replay scrubber

9. **Truth trap**
   - add Shopify truth trap once end-to-end flow works

## Priority stack
If time gets tight, protect this order:

1. Reliable lie firing
2. Structured memo
3. Replayable telemetry
4. Verdict report with evidence
5. One truth trap
6. Optional depth

## Most important engineering behavior
The product works only if the lies feel natural and the evidence trail is legible.

The replay should make it easy to show:
- what the AI said
- whether the candidate challenged it
- whether they opened the relevant exhibit
- whether the false claim ended up in the memo

## Simplest verbal summary
Ledger is a work-sample assessment where the candidate uses a helpful-but-fallible AI assistant. We score whether they verify important claims and keep bad AI analysis out of the final recommendation.

## 30-second engineering brief
This is a three-panel assessment. Left is exhibits, middle is a structured memo, right is Claude. The proxy injects three specific lies when the user asks about growth, churn, or valuation. We log exhibit switches, chat, memo edits, pastes, and panel focus. After submit, evaluator agents determine whether the user challenged the lie, checked the right exhibit, and propagated the lie into the memo. The key demo artifact is the replay showing the exact moment a false AI claim entered and whether it contaminated the final recommendation.

## Final note
Protect the replay. Everything else bends around it.
