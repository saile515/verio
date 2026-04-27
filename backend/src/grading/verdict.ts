import { BehaviorGrade } from "./behavior.js";
import { MemoGrade } from "./memo.js";
import { grade, populateUserPrompt } from "./util.js";

import {
    getFiredInjectionIndexes,
    getTotalAiResponses,
    Session,
} from "../sessions.js";
import { loadSystemPrompt } from "../system-prompts/util.js";

const agentPrompt = loadSystemPrompt("grading-verdict");
const userPrompt = loadSystemPrompt("grading-verdict-user");

export type VerdictOutcome =
    | "strong-hire"
    | "hire"
    | "lean-no-hire"
    | "no-hire";

export type VerdictBand = 
    | "low" 
    | "developing"
    | "strong" 
    | "exceptional";

export type PatternLabel =
    | "sophisticated-verifier"
    | "ghost-writer"
    | "competent-cargo-cult"
    | "paranoid-over-corrector"
    | "time-pressure-collapse"
    | "mixed-profile";

export interface VerdictDimension {
    score: number;
    band: VerdictBand;
    nearBoundary: boolean;
    evidenceBullets: string[];
}

export interface RecoveryDimension extends VerdictDimension {
    injectionsTriggered: number;
    injectionsChallengedValid: number;
    injectionsPropagated: number;
}

export interface Verdict {
    verdict: VerdictOutcome;
    verdictRationale: string;
    confidenceScore: number;
    recoveryFloorTriggered: boolean;
    patternLabel: PatternLabel;
    patternLabelConfidence: number;
    patternLabelSummary: string | null;
    keyObservations: string[];
    dimensions: {
        evidenceDiscipline: VerdictDimension;
        aiGovernance: VerdictDimension;
        recoveryUnderError: RecoveryDimension;
        analyticalJudgment: VerdictDimension;
    };
    radar: {
        evidenceDiscipline: number;
        aiGovernance: number;
        recoveryUnderError: number;
        analyticalJudgment: number;
        promptQuality: number | null;
        memoIntegrity: number | null;
    };
    contradictions: string[];
    flags: string[];
}

export interface VerdictSessionMetadata {
    created: string;
    expires: string;
    locked: boolean;
    firedInjections: number[];
    totalEvents: number;
    totalAiResponses: number;
}

export interface ReportMetrics {
    tabTime: number[];
    pastedWords: number;
}

const nullableNumberSchema = {
    anyOf: [{ type: "number" }, { type: "null" }],
};

const nullableStringSchema = {
    anyOf: [{ type: "string" }, { type: "null" }],
};

const dimensionSchema = {
    type: "object",
    properties: {
        score: { type: "number" },
        band: {
            type: "string",
            enum: ["low", "developing", "strong", "exceptional"],
        },
        nearBoundary: { type: "boolean" },
        evidenceBullets: {
            type: "array",
            items: { type: "string" },
        },
    },
    required: ["score", "band", "nearBoundary", "evidenceBullets"],
};

const recoveryDimensionSchema = {
    type: "object",
    properties: {
        score: { type: "number" },
        band: {
            type: "string",
            enum: ["low", "developing", "strong", "exceptional"],
        },
        nearBoundary: { type: "boolean" },
        injectionsTriggered: { type: "number" },
        injectionsChallengedValid: { type: "number" },
        injectionsPropagated: { type: "number" },
        evidenceBullets: {
            type: "array",
            items: { type: "string" },
        },
    },
    required: [
        "score",
        "band",
        "nearBoundary",
        "injectionsTriggered",
        "injectionsChallengedValid",
        "injectionsPropagated",
        "evidenceBullets",
    ],
};

function getSessionMetadata(session: Session): VerdictSessionMetadata {
    return {
        created: session.created.toISOString(),
        expires: session.expires.toISOString(),
        locked: session.locked,
        firedInjections: getFiredInjectionIndexes(session),
        totalEvents: session.events.length,
        totalAiResponses: getTotalAiResponses(session.events),
    };
}

export async function getVerdict(
    session: Session,
    behaviorGrade?: BehaviorGrade,
    memoGrade?: MemoGrade,
    reportMetrics?: ReportMetrics,
) {
    if (!behaviorGrade || !memoGrade) {
        return undefined;
    }

    const sessionPrompt = populateUserPrompt(userPrompt, {
        behaviorGrade: JSON.stringify(behaviorGrade),
        memoGrade: JSON.stringify(memoGrade),
        sessionMetadata: JSON.stringify(getSessionMetadata(session)),
        reportMetrics: JSON.stringify(reportMetrics ?? null),
    });

    const response = await grade<Verdict>({
        session,
        system: [{ type: "text", text: agentPrompt }],
        messages: [{ role: "user", content: sessionPrompt }],
        schema: {
            type: "object" as const,
            properties: {
                verdict: {
                    type: "string",
                    enum: [
                        "strong-hire",
                        "hire",
                        "lean-no-hire",
                        "no-hire",
                    ],
                },
                verdictRationale: { type: "string" },
                confidenceScore: { type: "number" },
                recoveryFloorTriggered: { type: "boolean" },
                patternLabel: {
                    type: "string",
                    enum: [
                        "sophisticated-verifier",
                        "ghost-writer",
                        "competent-cargo-cult",
                        "paranoid-over-corrector",
                        "time-pressure-collapse",
                        "mixed-profile",
                    ],
                },
                patternLabelConfidence: { type: "number" },
                patternLabelSummary: nullableStringSchema,
                keyObservations: {
                    type: "array",
                    items: { type: "string" },
                },
                dimensions: {
                    type: "object",
                    properties: {
                        evidenceDiscipline: dimensionSchema,
                        aiGovernance: dimensionSchema,
                        recoveryUnderError: recoveryDimensionSchema,
                        analyticalJudgment: dimensionSchema,
                    },
                    required: [
                        "evidenceDiscipline",
                        "aiGovernance",
                        "recoveryUnderError",
                        "analyticalJudgment",
                    ],
                },
                radar: {
                    type: "object",
                    properties: {
                        evidenceDiscipline: { type: "number" },
                        aiGovernance: { type: "number" },
                        recoveryUnderError: { type: "number" },
                        analyticalJudgment: { type: "number" },
                        promptQuality: nullableNumberSchema,
                        memoIntegrity: nullableNumberSchema,
                    },
                    required: [
                        "evidenceDiscipline",
                        "aiGovernance",
                        "recoveryUnderError",
                        "analyticalJudgment",
                        "promptQuality",
                        "memoIntegrity",
                    ],
                },
                contradictions: {
                    type: "array",
                    items: { type: "string" },
                },
                flags: {
                    type: "array",
                    items: { type: "string" },
                },
            },
            required: [
                "verdict",
                "verdictRationale",
                "confidenceScore",
                "recoveryFloorTriggered",
                "patternLabel",
                "patternLabelConfidence",
                "patternLabelSummary",
                "keyObservations",
                "dimensions",
                "radar",
                "contradictions",
                "flags",
            ],
        },
    });

    return response ?? undefined;
}
