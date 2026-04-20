import {
    MessageParam,
    TextBlockParam,
    Tool,
    ToolUseBlock,
} from "@anthropic-ai/sdk/resources";

import { Session } from "../sessions";

export interface CriteriaResult {
    score: number;
    evidence: string;
}

export interface Criteria {
    result: CriteriaResult;
}

export const criteriaResultSchema = {
    type: "object",
    properties: {
        score: { type: "number" },
        evidence: { type: "string" },
    },
    required: ["score", "evidence"],
};

export const criteriaSchema = {
    type: "object",
    properties: {
        result: criteriaResultSchema,
    },
    required: ["result"],
};

export async function grade<T>({
    session,
    system,
    messages,
    schema,
}: {
    session: Session;
    system: TextBlockParam[];
    messages: MessageParam[];
    schema: Tool.InputSchema;
}) {
    const response = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        cache_control: { type: "ephemeral" },
        system,
        messages,
        tools: [
            {
                name: "memo_analysis_output",
                description:
                    "Returns structured memo analysis results for a session",
                input_schema: schema,
            },
        ],
        tool_choice: { type: "tool", name: "output" },
    });

    const block = response.content.find(
        (block) => block.type == "tool_use" && block.name == "output",
    ) as ToolUseBlock;
    return (block?.input as T) ?? null;
}
