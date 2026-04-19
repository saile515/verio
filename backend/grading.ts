import { Session } from "./sessions";
import { contextFiles } from "./user-messaging";
import { readFileSync } from "node:fs";

const agentPrompt = readFileSync("./system-prompts/grading-memo.md", "utf-8");

export type RecommendationFound =
    | "pass"
    | "invest"
    | "invest-at-revised-terms"
    | "unclear"
    | "none";

export interface ScoredCriterion {
    score: number;
    evidence: string;
}

export interface RecommendationCalibration {
    score: number;
    recommendationFound: RecommendationFound;
    evidence: string;
}

export interface MemoQuality {
    factualCorrectness: ScoredCriterion;
    reasoningLinkage: ScoredCriterion;
    tradeoffHandling: ScoredCriterion;
    recommendationCalibration: RecommendationCalibration;
}

export interface MemoQualitySchema {
    memoQuality: MemoQuality;
}

export async function gradeMemo(session: Session) {
    if (!session.memo) {
        return undefined;
    }

    const response = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        cache_control: { type: "ephemeral" },
        system: [
            ...contextFiles,
            {
                type: "text",
                text: agentPrompt,
            },
        ],
        messages: [{ role: "user", content: session.memo }],
        tools: [
            {
                name: "memo_analysis_output",
                description:
                    "Returns structured memo analysis results for a session",
                input_schema: {
                    type: "object" as const,
                    properties: {
                        memoQuality: {
                            type: "object",
                            properties: {
                                factualCorrectness: {
                                    type: "object",
                                    properties: {
                                        score: { type: "number" },
                                        evidence: { type: "string" },
                                    },
                                    required: ["score", "evidence"],
                                },
                                reasoningLinkage: {
                                    type: "object",
                                    properties: {
                                        score: { type: "number" },
                                        evidence: { type: "string" },
                                    },
                                    required: ["score", "evidence"],
                                },
                                tradeoffHandling: {
                                    type: "object",
                                    properties: {
                                        score: { type: "number" },
                                        evidence: { type: "string" },
                                    },
                                    required: ["score", "evidence"],
                                },
                                recommendationCalibration: {
                                    type: "object",
                                    properties: {
                                        score: { type: "number" },
                                        recommendationFound: {
                                            type: "string",
                                            enum: [
                                                "pass",
                                                "invest",
                                                "invest-at-revised-terms",
                                                "unclear",
                                                "none",
                                            ],
                                        },
                                        evidence: { type: "string" },
                                    },
                                    required: [
                                        "score",
                                        "recommendationFound",
                                        "evidence",
                                    ],
                                },
                            },
                            required: [
                                "factualCorrectness",
                                "reasoningLinkage",
                                "tradeoffHandling",
                                "recommendationCalibration",
                            ],
                        },
                    },
                    required: ["memoQuality"],
                },
            },
        ],
        tool_choice: { type: "tool", name: "memo_analysis_output" },
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    const result = toolUse?.input as MemoQualitySchema | undefined;
    return result?.memoQuality;
}
