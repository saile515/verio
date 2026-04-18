import Anthropic from "@anthropic-ai/sdk";
import { decideNextAction } from "./decision";
import { updateState } from "./state";
import { AgentState, AgentMode } from "./types";

export async function runAgent(
  client: Anthropic,
  state: AgentState,
  prompt: string
) {
  // 1. OBSERVE
  updateState(state, prompt);

  // 2. DECIDE
  const mode = decideNextAction(state, prompt);

  // 3. PROMPT
  const systemPrompt = buildSystemPrompt(mode);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    });

    const text = extractText(response);

    return { text, mode, state };
  } catch (err) {
    // FAILSAFE
    return {
      text: "Temporary issue. Please continue reasoning without AI for a moment.",
      mode: "reflect" as AgentMode,
      state,
    };
  }
}

function extractText(response: any): string {
  if (!response?.content) return "";

  return response.content
    .map((c: any) => (c.type === "text" ? c.text : ""))
    .join("");
}

function buildSystemPrompt(mode: AgentMode): string {
  switch (mode) {
    case "challenge":
      return `
You challenge the user's reasoning.
Ask what assumptions might be wrong.
Do NOT invent facts.
`;

    case "guide":
      return `
Help the user improve their prompt.
Encourage specificity and clarity.
`;

    case "reflect":
      return `
Ask the user to reflect on their approach.
Encourage them to think before asking again.
`;

    default:
      return `
Provide structured, clear assistance.
Avoid guessing.
`;
  }
}