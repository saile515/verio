import { Criteria, criteriaResultSchema, criteriaSchema, grade } from "./util";

import { Session } from "../sessions";
import { contextFiles } from "../context-files";
import { readFileSync } from "node:fs";

const agentPrompt = readFileSync("../system-prompts/grading-memo.md", "utf-8");

export type RecommendationFound =
    | "pass"
    | "invest"
    | "invest-at-revised-terms"
    | "unclear"
    | "none";

export interface RecommendationCriteria {
    recommendationFound: RecommendationFound;
}

export interface MemoQuality {
    factualCorrectness: Criteria;
    reasoningLinkage: Criteria;
    tradeoffHandling: Criteria;
    recommendation: RecommendationCriteria;
}

export interface MemoQualitySchema {
    memoQuality: MemoQuality;
}

export async function gradeMemo(session: Session) {
    if (!session.memo) {
        return undefined;
    }

    const response = await grade<MemoQualitySchema>({
        session,
        system: [
            ...contextFiles,
            {
                type: "text",
                text: agentPrompt,
            },
        ],
        messages: [{ role: "user", content: session.memo }],
        schema: {
            type: "object" as const,
            properties: {
                memoQuality: {
                    type: "object",
                    properties: {
                        factualCorrectness: criteriaSchema,
                        reasoningLinkage: criteriaSchema,
                        tradeoffHandling: criteriaSchema,
                        recommendation: {
                            type: "object",
                            properties: {
                                result: criteriaResultSchema,
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
                            },
                            required: ["result", "recommendationFound"],
                        },
                    },
                    required: [
                        "factualCorrectness",
                        "reasoningLinkage",
                        "tradeoffHandling",
                        "recommendation",
                    ],
                },
            },
            required: ["memoQuality"],
        },
    });

    return response?.memoQuality;
}
