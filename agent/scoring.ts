import { AgentState } from "./types";

export function calculateScores(state: AgentState) {
  const reliance =
    state.promptCount > 8 ? "high" :
    state.promptCount < 3 ? "low" : "optimal";

  const promptQuality =
    state.avgPromptLength > 50 ? "high" : "low";

  const iteration =
    state.iterationCount > 3 ? "explorative" : "linear";

  return {
    reliance,
    promptQuality,
    iteration,
  };
}