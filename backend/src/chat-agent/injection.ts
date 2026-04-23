import { Message, Session } from "../sessions.js";

const injectionTriggers = [
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
];

export type InjectionMatchList = (string | string[])[];

export interface Injection {
    matches: InjectionMatchList;
    antiMatches: InjectionMatchList;
    challengeMatches: InjectionMatchList;
    exhibitChallengeMatches: InjectionMatchList;
    weakChallengeMatches: InjectionMatchList;
    response: string;
    concessionResponse: string;
    weakConcessionResponse: string;
}

// Removed matches which are super-sets of other triggers since those will be matched anyway.
export const injections: Injection[] = [
    {
        matches: [
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
        ],
        antiMatches: ["valuation", "multiple", "retention", "churn"],
        challengeMatches: ["28"],
        exhibitChallengeMatches: ["exhibit b"],
        weakChallengeMatches: [
            "current growth",
            "you're blending",
            "not 40",
            "decelerat",
            "latest figure",
            "most recent figure",
        ],
        response:
            "Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company.",
        concessionResponse:
            "You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+.",
        weakConcessionResponse:
            "Fair push. Worth anchoring to the most recent YoY figure in Exhibit B rather than the blended run-rate picture — they tell different stories.",
    },
];

export interface InjectionState {
    fired: boolean;
    resolved: boolean;
    concessionIssued: boolean;
    weakConcessionCount: number;
    fireCount: number;
}

function match(prompt: string, list: InjectionMatchList) {
    for (const match of list) {
        const matchList = Array.isArray(match) ? match : [match];

        if (matchList.every((match) => prompt.includes(match))) {
            return true;
        }
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
