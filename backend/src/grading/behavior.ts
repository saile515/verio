import { grade, populateUserPrompt } from "./util.js";
import { MemoGrade } from "./memo.js";

import { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import { Session, UserEvent } from "../sessions.js";
import { loadSystemPrompt } from "../system-prompts/util.js";

const agentPrompt = loadSystemPrompt("grading-behavior");
const userPrompt = loadSystemPrompt("grading-behavior-user");

export type ConversationRole =
    | "candidate"
    | "assistant"
    | "injection"
    | "concession"
    | "weak-concession"
    | "reinforced-assistant";

export interface ConversationLogEntry {
    timestamp: number;
    role: ConversationRole;
    content: string;
    injectionIndex?: number;
}

export interface TelemetryEvent {
    timestamp: number;
    eventType: "session-start" | "session-end" | "tab-switch" | "paste";
    tab?: number;
    wordCount?: number;
}

export interface SessionMetadata {
    created: string;
    expires: string;
    locked: boolean;
    firedInjections: number[];
    totalAiResponses: number;
    unavailableTelemetry: string[];
}

export interface InjectionBehavior {
    index: number;
    status: "triggered" | "not-triggered";
    outcome:
        | "challenged-valid"
        | "challenged-weak"
        | "verified-silently"
        | "ignored"
        | "propagated"
        | "accepted-correctly"
        | "accepted-with-nuance"
        | "wrongly-rejected"
        | "not-triggered";
    outcomeScore: number | null;
    challengeStrength: "none" | "weak" | "valid" | null;
    challengeEvidence: string | null;
    challengeTimestamp: number | null;
    exhibitReopened: boolean | null;
    exhibitReopenTimestamp: number | null;
    timeToReopenSeconds: number | null;
    confidence: "high" | "medium" | "low";
    uncertaintyNotes: string | null;
}

export interface ExhibitReopen {
    exhibit: string;
    timestamp: number;
    dwellSeconds: number | null;
}

export interface PasteEvent {
    timestamp: number;
    source: "chat" | "exhibit" | "ambiguous";
    wordCount: number;
    contentPreview: string | null;
}

export interface PromptQualityPrompt {
    timestamp: number;
    level: number;
    content: string;
    reason: string;
}

export interface BehaviorGrade {
    injections: InjectionBehavior[];
    exhibitReopens: {
        totalQualifying: number | null;
        events: ExhibitReopen[];
    };
    pasteDependence: {
        score: number | null;
        chatToMemoPasteCount: number | null;
        exhibitToMemoPasteCount: number | null;
        ambiguousPasteCount: number;
        pasteEvents: PasteEvent[];
    };
    timeBeforeFirstAi: {
        score: number | null;
        elapsedSeconds: number | null;
    };
    promptQuality: {
        trimmedMean: number | null;
        maxLevelAchieved: number | null;
        promptCount: number;
        levelDistribution: {
            "0": number;
            "1": number;
            "2": number;
            "3": number;
            "4": number;
        };
        notablePrompts: PromptQualityPrompt[];
    };
    flags: string[];
}

const nullableNumberSchema = {
    anyOf: [{ type: "number" }, { type: "null" }],
};

const nullableStringSchema = {
    anyOf: [{ type: "string" }, { type: "null" }],
};

const nullableBooleanSchema = {
    anyOf: [{ type: "boolean" }, { type: "null" }],
};

const injectionBehaviorSchema = {
    type: "object",
    properties: {
        index: { type: "number" },
        status: { type: "string", enum: ["triggered", "not-triggered"] },
        outcome: {
            type: "string",
            enum: [
                "challenged-valid",
                "challenged-weak",
                "verified-silently",
                "ignored",
                "propagated",
                "accepted-correctly",
                "accepted-with-nuance",
                "wrongly-rejected",
                "not-triggered",
            ],
        },
        outcomeScore: nullableNumberSchema,
        challengeStrength: {
            anyOf: [
                { type: "string", enum: ["none", "weak", "valid"] },
                { type: "null" },
            ],
        },
        challengeEvidence: nullableStringSchema,
        challengeTimestamp: nullableNumberSchema,
        exhibitReopened: nullableBooleanSchema,
        exhibitReopenTimestamp: nullableNumberSchema,
        timeToReopenSeconds: nullableNumberSchema,
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        uncertaintyNotes: nullableStringSchema,
    },
    required: [
        "index",
        "status",
        "outcome",
        "outcomeScore",
        "challengeStrength",
        "challengeEvidence",
        "challengeTimestamp",
        "exhibitReopened",
        "exhibitReopenTimestamp",
        "timeToReopenSeconds",
        "confidence",
        "uncertaintyNotes",
    ],
};

const exhibitReopenSchema = {
    type: "object",
    properties: {
        exhibit: { type: "string" },
        timestamp: { type: "number" },
        dwellSeconds: nullableNumberSchema,
    },
    required: ["exhibit", "timestamp", "dwellSeconds"],
};

const pasteEventSchema = {
    type: "object",
    properties: {
        timestamp: { type: "number" },
        source: { type: "string", enum: ["chat", "exhibit", "ambiguous"] },
        wordCount: { type: "number" },
        contentPreview: nullableStringSchema,
    },
    required: ["timestamp", "source", "wordCount", "contentPreview"],
};

const promptQualityPromptSchema = {
    type: "object",
    properties: {
        timestamp: { type: "number" },
        level: { type: "number" },
        content: { type: "string" },
        reason: { type: "string" },
    },
    required: ["timestamp", "level", "content", "reason"],
};

function textFromContent(content: ContentBlockParam[]) {
    return content
        .map((block) => ("text" in block ? block.text : ""))
        .join("");
}

function toConversationLog(events: UserEvent[]): ConversationLogEntry[] {
    return events.flatMap<ConversationLogEntry>((event) => {
        switch (event.type) {
            case "user-message":
                return [
                    {
                        timestamp: event.time,
                        role: "candidate",
                        content: textFromContent(event.message),
                    },
                ];
            case "assistant-message":
                return [
                    {
                        timestamp: event.time,
                        role: "assistant",
                        content: textFromContent(event.message),
                    },
                ];
            case "injection-message":
                return [
                    {
                        timestamp: event.time,
                        role: "injection",
                        content: textFromContent(event.message),
                        injectionIndex: event.index,
                    },
                ];
            case "concession-message":
                return [
                    {
                        timestamp: event.time,
                        role: "concession",
                        content: textFromContent(event.message),
                        injectionIndex: event.index,
                    },
                ];
            case "weak-concession-message":
                return [
                    {
                        timestamp: event.time,
                        role: "weak-concession",
                        content: textFromContent(event.message),
                        injectionIndex: event.index,
                    },
                ];
            case "reinforced-assistant-message":
                return [
                    {
                        timestamp: event.time,
                        role: "reinforced-assistant",
                        content: textFromContent(event.message),
                        injectionIndex: event.index,
                    },
                ];
            default:
                return [];
        }
    });
}

function toEventLog(events: UserEvent[]): TelemetryEvent[] {
    return events.flatMap<TelemetryEvent>((event) => {
        switch (event.type) {
            case "session-start":
                return [{ timestamp: event.time, eventType: event.type }];
            case "session-end":
                return [{ timestamp: event.time, eventType: event.type }];
            case "tab-switch":
                return [
                    {
                        timestamp: event.time,
                        eventType: event.type,
                        tab: event.tab,
                    },
                ];
            case "paste":
                return [
                    {
                        timestamp: event.time,
                        eventType: event.type,
                        wordCount: event.wordCount,
                    },
                ];
            default:
                return [];
        }
    });
}

function getFiredInjections(session: Session) {
    return session.injectionState
        .map((injection, index) => ({ index, injection }))
        .filter(({ injection }) => injection.fired)
        .map(({ index }) => index);
}

function getTotalAiResponses(events: UserEvent[]) {
    return events.filter((event) =>
        [
            "assistant-message",
            "injection-message",
            "concession-message",
            "weak-concession-message",
            "reinforced-assistant-message",
        ].includes(event.type),
    ).length;
}

export async function gradeBehavior(session: Session, memoGrade?: MemoGrade) {
    let memoPropagationSummary: MemoGrade["propagation"] | null = null;

    if (memoGrade) {
        memoPropagationSummary = memoGrade.propagation;
    } else if (session.report?.memo) {
        memoPropagationSummary = session.report.memo.propagation;
    }

    const sessionMetadata: SessionMetadata = {
        created: session.created.toISOString(),
        expires: session.expires.toISOString(),
        locked: session.locked,
        firedInjections: getFiredInjections(session),
        totalAiResponses: getTotalAiResponses(session.events),
        unavailableTelemetry: [
            "scroll-depth",
            "paste-source",
            "true-exhibit-dwell",
        ],
    };

    const sessionPrompt = populateUserPrompt(userPrompt, {
        conversationLog: JSON.stringify(toConversationLog(session.events)),
        eventLog: JSON.stringify(toEventLog(session.events)),
        sessionMetadata: JSON.stringify(sessionMetadata),
        memoGrade: JSON.stringify(
            memoPropagationSummary
                ? { propagation: memoPropagationSummary }
                : null,
        ),
    });

    const response = await grade<BehaviorGrade>({
        session,
        system: [{ type: "text", text: agentPrompt }],
        messages: [{ role: "user", content: sessionPrompt }],
        schema: {
            type: "object" as const,
            properties: {
                injections: {
                    type: "array",
                    items: injectionBehaviorSchema,
                    description:
                        "one entry per injection index 0-4; false injections are 0-3 and Shopify truth trap is 4",
                },
                exhibitReopens: {
                    type: "object",
                    properties: {
                        totalQualifying: nullableNumberSchema,
                        events: {
                            type: "array",
                            items: exhibitReopenSchema,
                        },
                    },
                    required: ["totalQualifying", "events"],
                },
                pasteDependence: {
                    type: "object",
                    properties: {
                        score: nullableNumberSchema,
                        chatToMemoPasteCount: nullableNumberSchema,
                        exhibitToMemoPasteCount: nullableNumberSchema,
                        ambiguousPasteCount: { type: "number" },
                        pasteEvents: {
                            type: "array",
                            items: pasteEventSchema,
                        },
                    },
                    required: [
                        "score",
                        "chatToMemoPasteCount",
                        "exhibitToMemoPasteCount",
                        "ambiguousPasteCount",
                        "pasteEvents",
                    ],
                },
                timeBeforeFirstAi: {
                    type: "object",
                    properties: {
                        score: nullableNumberSchema,
                        elapsedSeconds: nullableNumberSchema,
                    },
                    required: ["score", "elapsedSeconds"],
                },
                promptQuality: {
                    type: "object",
                    properties: {
                        trimmedMean: nullableNumberSchema,
                        maxLevelAchieved: nullableNumberSchema,
                        promptCount: { type: "number" },
                        levelDistribution: {
                            type: "object",
                            properties: {
                                "0": { type: "number" },
                                "1": { type: "number" },
                                "2": { type: "number" },
                                "3": { type: "number" },
                                "4": { type: "number" },
                            },
                            required: ["0", "1", "2", "3", "4"],
                        },
                        notablePrompts: {
                            type: "array",
                            items: promptQualityPromptSchema,
                        },
                    },
                    required: [
                        "trimmedMean",
                        "maxLevelAchieved",
                        "promptCount",
                        "levelDistribution",
                        "notablePrompts",
                    ],
                },
                flags: {
                    type: "array",
                    items: { type: "string" },
                },
            },
            required: [
                "injections",
                "exhibitReopens",
                "pasteDependence",
                "timeBeforeFirstAi",
                "promptQuality",
                "flags",
            ],
        },
    });

    return response ?? undefined;
}
