import { AgentMode, InteractionEvent } from "../types";


export function trackEvent(
  history: InteractionEvent[],
  type: "prompt" | "response",
  content: string,
  mode?: AgentMode
) {
  history.push({
    type,
    content,
    timestamp: Date.now(),
    mode,
  });
}