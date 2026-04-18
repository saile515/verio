import { AgentState, AgentMode } from "./types";

export function decideNextAction(state: AgentState, prompt: string): AgentMode {
  // over-reliance detection
  if (state.promptCount > 6 && prompt.length < 30) {
    return "challenge";
  }

  // weak prompting
  if (prompt.length < 20) {
    return "guide";
  }

  // too many iterations
  if (state.iterationCount > 3) {
    return "reflect";
  }

  return "help";
}