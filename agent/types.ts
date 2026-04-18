export type AgentMode =
  | "help"
  | "challenge"
  | "guide"
  | "reflect";

export interface InteractionEvent {
  type: "prompt" | "response";
  timestamp: number;
  content: string;
  mode?: AgentMode;
}

export interface AgentState {
  promptCount: number;
  startTime: number;
  lastPromptTime: number;

  avgPromptLength: number;
  iterationCount: number;

  relianceScore: number;
  criticalThinkingScore: number;

  history: InteractionEvent[];
}