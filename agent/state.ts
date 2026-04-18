import { AgentState } from "./types";

export function createInitialState(): AgentState {
  const now = Date.now();

  return {
    promptCount: 0,
    startTime: now,
    lastPromptTime: now,
    avgPromptLength: 0,
    iterationCount: 0,
    relianceScore: 0,
    criticalThinkingScore: 0,
    history: [],
  };
}

export function updateState(state: AgentState, prompt: string) {
  const now = Date.now();

  const timeDiff = now - state.lastPromptTime;

  state.promptCount += 1;
  state.lastPromptTime = now;

  // rolling avg
  state.avgPromptLength =
    (state.avgPromptLength * (state.promptCount - 1) + prompt.length) /
    state.promptCount;

  // iteration signal
  if (timeDiff < 5000) {
    state.iterationCount++;
  }

  return state;
}