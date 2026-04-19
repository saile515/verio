# Injection logic

Backend decision tree and session state.
Read alongside injection_triggers.md and injection_responses.md.

---

## Session state shape

Initialise this object when a new session starts.
All injections have the same shape to prevent undefined field bugs.

```typescript
type InjectionState = {
  fired: boolean
  resolved: boolean
  concession_issued: boolean   // true after valid OR weak concession — prevents infinite concession loops
  weak_concession_count: number
  fire_count: number           // used by injection 5 to rotate initial/re-anchor/passthrough
}

const session_state = {
  injections: {
    1: { fired: false, resolved: false, concession_issued: false, weak_concession_count: 0, fire_count: 0 },
    2: { fired: false, resolved: false, concession_issued: false, weak_concession_count: 0, fire_count: 0, churn_contaminated: false },
    3: { fired: false, resolved: false, concession_issued: false, weak_concession_count: 0, fire_count: 0 },
    4: { fired: false, resolved: false, concession_issued: false, weak_concession_count: 0, fire_count: 0 },
    5: { fired: false, resolved: false, concession_issued: false, weak_concession_count: 0, fire_count: 0 }
  },
  conversation_history: [],   // full message array including ALL turns — never skip user messages
  event_log: [],
  session_start: Date.now(),
  session_mutex: false        // concurrency guard — see B10.5 fix below
}
```

Invariant to assert on every state write:
- if injection[2].churn_contaminated === true then injection[2].fired must also be true
- if any injection.resolved === true then injection.fired must also be true

---

## Conversation history rules — read this first

Every candidate message MUST be stored in conversation_history as role: "user" regardless of
whether an injection fires. Never skip the user turn. Skipping creates consecutive assistant
messages which breaks the Anthropic API alternation requirement.

Internal source_tag field is used for scoring. The role field is always "user" or "assistant".
Never send source_tag to the Claude API — strip it when building the API payload.

```typescript
// Correct message shape for conversation_history
type HistoryMessage = {
  role: "user" | "assistant"
  content: string
  source_tag?: "candidate" | "claude" | "injection" | "concession" | "weak_concession" | "reinforcement"
  timestamp: number
  injection_id?: number
}
```

When building the Claude API payload, map to:
```typescript
{ role: message.role, content: message.content }
// source_tag, timestamp, injection_id are stripped
```

---

## Challenge classification — definition

Before implementing Step 1, define what constitutes valid vs weak challenge.

Valid challenge: message contains a discriminator keyword for the active injection AND
(contains an injection-specific number OR contains an exhibit reference)
See injection_triggers.md for discriminator keywords, numbers, and exhibit references per injection.

Weak challenge: message contains a discriminator keyword for the active injection BUT
no specific number and no exhibit reference.

Example for injection 2:
- "I don't think churn is that high, Exhibit B shows 6%" → valid (number + exhibit)
- "Where are you getting 12% from?" → valid (number)
- "That seems off" → NOT a challenge (no discriminator keyword)
- "I'd want to double-check that churn figure" → weak (discriminator keyword, no number/exhibit)

---

## Decision tree — run on every candidate message

Execute these steps in order. Stop at the first step that produces a response.
ALWAYS store the candidate message first (step 0) before any branching.

### Step 0 — Store candidate message immediately

```typescript
conversation_history.push({
  role: "user",
  content: candidate_message,
  source_tag: "candidate",
  timestamp: Date.now()
})
```

Never skip this step. Even if an injection fires, the user message goes in first.

### Step 0.5 — Summary request detection

Check if message matches summary trigger keywords (injection_triggers.md Step 0).

If summary request detected:
  Find the lowest-numbered unfired injection from [1, 2, 3, 4] (skip 5).
  If an unfired injection exists:
    Treat as if that injection's topic was asked.
    Fire that injection response (skip to Step 2 handling for that injection).
  If all injections 1-4 already fired:
    Pass through to Claude normally (Step 3).

### Step 1 — Check for active unresolved injections

Iterate injections in order [1, 2, 3, 4, 5] checking for fired=true AND resolved=false.

For each active unresolved injection:
  Classify the candidate message:
  - Valid challenge? → return concession response, update state, store, return
  - Weak challenge? → return weak concession response, update state, store, return
  - No challenge → continue to next injection in loop

Tiebreak when multiple injections are active and message is ambiguous:
  Require at least one injection-specific discriminator number to assign challenge to that injection.
  If message is truly ambiguous (no specific numbers, multiple active injections):
    Treat as no challenge. Pass to Step 2.

State updates on valid challenge:
  injection.resolved = true
  injection.concession_issued = true
  if injection_id === 2: injection.churn_contaminated = false
  log: { type: "concession", injection_id, timestamp }
  store response: { role: "assistant", content: concession_text, source_tag: "concession", injection_id }
  RETURN — do not proceed to Step 2

State updates on weak challenge:
  injection.weak_concession_count += 1
  injection.concession_issued = true
  if injection_id === 2: injection.churn_contaminated = false  // clear on weak too — prevents reinforcement contradiction
  if weak_concession_count >= 2: injection.resolved = true    // force resolution after 2 weak concessions
  log: { type: "weak_concession", injection_id, timestamp }
  store response: { role: "assistant", content: weak_concession_text, source_tag: "weak_concession", injection_id }
  RETURN — do not proceed to Step 2

After Step 1 loop completes with no challenge detected: proceed to Step 2.

### Step 2 — Check for new injection triggers

Normalize input: const normalized = candidate_message.toLowerCase().trim()

Check trigger keywords in priority order: 4 > 2 > 3 > 1 > 5

For each injection in priority order:
  If injection.fired === true: skip (already fired)
  Exception: injection 5 always evaluates regardless of fired state
  Check trigger keywords against normalized input
  Check exclusion rules against normalized input
  If triggers match AND exclusions do not match:
    Fire that injection

Injection 5 fire logic:
  if fire_count === 0: return initial response
  if fire_count === 1: return re-anchor response
  if fire_count >= 2: skip injection 5, pass to Claude

State updates on injection fire:
  injection.fired = true
  injection.fire_count += 1
  if injection_id === 2: injection.churn_contaminated = true
  log: { type: "injection", injection_id, timestamp, candidate_message }
  store response: { role: "assistant", content: injection_text, source_tag: "injection", injection_id }
  RETURN — do not call Claude, do not proceed to Step 3

If no injection fires in priority loop: proceed to Step 3.

### Step 3 — Call Claude normally

Build API payload:
```typescript
const api_payload = {
  model: "claude-opus-4-5",
  max_tokens: 1024,
  temperature: 0.7,
  system: assistant_system_prompt,   // from assistant_system_prompt.md
  messages: conversation_history
    .filter(m => m.source_tag !== "reinforcement")  // strip synthetic reinforcement messages
    .map(m => ({ role: m.role, content: m.content }))  // strip internal fields
}
```

Call Claude API. Get response text.

### Step 4 — Apply reinforcement if active

Conditions (ALL must be true to append reinforcement):
1. injection[2].churn_contaminated === true
2. injection[2].concession_issued === false
3. No injection fired in Step 2 this turn (if Step 2 fired, reinforcement is skipped)
4. Normalized message matches reinforcement trigger keywords (injection_triggers.md)

If all conditions met:
  claude_response += "\n\nOne thing to keep in mind: the 12% gross logo churn remains the main diligence flag here."
  Store claude_response with source_tag: "reinforcement" on a separate message entry OR
  flag the combined message as partially reinforced in the source_tag

### Step 5 — Store Claude response and return

```typescript
conversation_history.push({
  role: "assistant",
  content: claude_response,
  source_tag: "claude",
  timestamp: Date.now()
})
```

Log to event_log. Return claude_response to frontend.

---

## Session rules

| Rule | Detail |
|---|---|
| Always store user message first | Step 0 runs before any branching. Never skip a user turn. |
| Summary requests route to injections | Detect before normal trigger check. Fire next unfired injection. |
| Challenge detection before trigger detection | Step 1 always runs before Step 2. |
| Valid challenge requires specificity | Number OR exhibit reference required. Generic "that's not right" is not enough. |
| Weak concession clears churn_contaminated | Prevents reinforcement contradicting the concession. |
| Max 2 weak concessions per injection | After 2 weak concessions, force resolved=true. |
| Priority order for triggers | 4 > 2 > 3 > 1 > 5 |
| Injection 4 added exclusions to injection 3 | Prevents I3 from shadowing I4 — see injection_triggers.md. |
| Injection 5 rotates responses | fire_count 0 → initial, 1 → re-anchor, 2+ → Claude. |
| Reinforcement gated on concession_issued | Never appends after any concession was issued. |
| Reinforcement skipped when injection fires | If Step 2 fires, Step 4 is skipped for that turn. |
| Role tags are user/assistant only in API | source_tag is internal. Never sent to Claude API. |
| All responses in history | Injections, concessions, Claude responses all stored with role: "assistant". |

---

## Concurrency guard

Per-session mutex to prevent double-fires from rapid client messages.

```typescript
async function handleMessage(session_id: string, message: string) {
  const session = getSession(session_id)

  // Acquire mutex
  if (session.session_mutex) {
    // Return cached last response or 429
    return session.last_response
  }
  session.session_mutex = true

  try {
    // Run decision tree
    const response = await processMessage(session, message)
    session.last_response = response
    return response
  } finally {
    session.session_mutex = false
  }
}
```

---

## Logging schema

Every injection-related event logged with this structure for scoring agents:

```typescript
{
  type: "injection" | "concession" | "weak_concession" | "reinforcement" | "summary_routed",
  injection_id: 1 | 2 | 3 | 4 | 5,
  timestamp: number,        // unix milliseconds, server clock
  candidate_message: string,
  response_returned: string,
  challenge_classification?: "valid" | "weak" | null
}
```

Store full log in session state. Pass to scoring agents at session end.
