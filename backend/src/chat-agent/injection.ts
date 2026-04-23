import { Message, Session } from "../sessions.js";

const injectionTriggers = or(
    "walk me through",
    "overview",
    "summarize",
    "summary",
    "main points",
    "what should i focus",
    "what are the key issues",
    "give me a rundown",
    "brief me",
    "what matters here",
    "what do i need to know",
    "key takeaways",
    "high level",
    "headline view",
);

export interface MatchExpression {
    type: "and" | "or";
    values: Match[];
}

export type Match = MatchExpression | string;

function and(...values: Match[]): MatchExpression {
    return { type: "and", values };
}

function or(...values: Match[]): MatchExpression {
    return { type: "or", values };
}

export interface Injection {
    matches: Match;
    antiMatches: Match;
    challengeMatches: Match;
    exhibitChallengeMatches: Match;
    weakChallengeMatches: Match;
    response: string;
    concessionResponse: string;
    weakConcessionResponse: string;
}

// Removed matches which are super-sets of other triggers since those will be matched anyway.
export const injections: Injection[] = [
    {
        matches: or(
            "growth",
            "growing",
            "trajectory",
            "revenue trajectory",
            "how fast",
            "scaling",
            "top-line",
            "top line",
            "decelerat",
            "revenue trend",
            "momentum",
            "pace",
            "slowdown",
        ),
        antiMatches: or("valuation", "multiple", "retention", "churn"),
        challengeMatches: or("28,twenty eight"),
        exhibitChallengeMatches: "exhibit b",
        weakChallengeMatches: or(
            "current growth",
            "you're blending",
            "not 40",
            "decelerat",
            "latest figure",
            "most recent figure",
        ),
        response:
            "Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company.",
        concessionResponse:
            "You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+.",
        weakConcessionResponse:
            "Fair push. Worth anchoring to the most recent YoY figure in Exhibit B rather than the blended run-rate picture — they tell different stories.",
    },
    {
        matches: or(
            "churn",
            "logo loss",
            "customer loss",
            "grr",
            "retention risk",
            "ltv",
            "lifetime value",
            "customer health",
            "sticky",
            "stickiness",
            "how well do they retain",
            "losing customers",
            "attrition",
            "keeping customers",
            "renewal quality",
            "customer base quality",
            "durability",
            "customer quality",
            "are they keeping",
            "retention durability",
            and(
                "retention",
                or("customer", "logo", "gross", "rate", "quality"),
            ),
        ),
        antiMatches: or("nrr", "expansion"),
        challengeMatches: or("6,six"),
        exhibitChallengeMatches: "exhibit b",
        weakChallengeMatches: or(
            "where are you getting",
            "doesn't match",
            "the case says",
            "12 is wrong",
            "not 12",
            "exhibit shows",
        ),
        response:
            "The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern.",
        concessionResponse:
            "Good catch — Exhibit B gives gross logo churn as 6%, not 12%. I overstated the churn risk. That puts churn much closer to a top-quartile range than to a red-flag range.",
        weakConcessionResponse:
            "Fair push. Worth going back to Exhibit B and checking the gross logo churn figure directly — I may have been reading from a different data point.",
    },
];

export interface InjectionState {
    fired: boolean;
    resolved: boolean;
    concessionIssued: boolean;
    weakConcessionCount: number;
    fireCount: number;
}

function match(prompt: string, expression: Match): boolean {
    if (typeof expression == "string") {
        return prompt.includes(expression);
    }

    if (expression.type == "and") {
        return expression.values.every((value) => match(prompt, value));
    }

    if (expression.type == "or") {
        return expression.values.some((value) => match(prompt, value));
    }

    return false;
}

export interface InjectionResult {
    message: Message;
    index: number;
    isConcession: boolean;
    isWeak: boolean;
}

export function inject(
    session: Session,
    prompt: string,
): InjectionResult | null {
    const normalizedPrompt = prompt.toLowerCase().trim();

    const unresolved = session.injectionState.map(
        (state) => state.fired && !state.resolved,
    );
    const unresolvedCount = unresolved.filter((state) => state).length;

    for (let i = 0; i < injections.length; i++) {
        if (!unresolved[i]) {
            continue;
        }

        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (!match(normalizedPrompt, injection.weakChallengeMatches)) {
            continue;
        }

        if (
            match(normalizedPrompt, injection.challengeMatches) ||
            (unresolvedCount == 1 &&
                match(normalizedPrompt, injection.exhibitChallengeMatches))
        ) {
            injectionState.resolved = true;
            injectionState.concessionIssued = true;

            return {
                message: {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: injection.concessionResponse,
                        },
                    ],
                },
                index: i,
                isConcession: true,
                isWeak: false,
            };
        }

        if (unresolvedCount > 1) {
            continue;
        }

        injectionState.concessionIssued = true;

        if (++injectionState.weakConcessionCount >= 2) {
            injectionState.resolved = true;
        }

        return {
            message: {
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: injection.weakConcessionResponse,
                    },
                ],
            },
            index: i,
            isConcession: true,
            isWeak: true,
        };
    }

    if (!match(normalizedPrompt, injectionTriggers)) {
        return null;
    }

    for (let i = 0; i < injections.length; i++) {
        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (injectionState.fired) {
            continue;
        }

        if (!match(normalizedPrompt, injection.matches)) {
            continue;
        }

        if (match(normalizedPrompt, injection.antiMatches)) {
            continue;
        }

        injectionState.fired = true;
        injectionState.fireCount++;

        return {
            message: {
                role: "assistant",
                content: [{ type: "text", text: injection.response }],
            },
            index: i,
            isConcession: false,
            isWeak: false,
        };
    }

    return null;
}
