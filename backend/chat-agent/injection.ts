import { Message, Session } from "../sessions";

export type InjectionMatchList = (string | string[])[];

export interface Injection {
    matches: InjectionMatchList;
    antiMatches: InjectionMatchList;
    challengeMatches: InjectionMatchList;
    response: string;
    concessionResponse: string;
}

export const injections: Injection[] = [
    {
        matches: [
            "growth",
            "growing",
            "growth rate",
            "trajectory",
            "revenue trajectory",
            "how fast",
            "scaling",
            "top-line",
            "revenue growth",
            "decelerat",
        ],
        antiMatches: ["valuation", "multiple", "retention", "churn"],
        response:
            "Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company.",
        concessionResponse:
            "You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+.",
        challengeMatches: ["28%", "exhibit b", ["historical", "current"]],
    },
];

export interface InjectionState {
    fired: boolean;
    challenged: boolean;
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
}

export function inject(
    session: Session,
    prompt: string,
): InjectionResult | null {
    const normalizedPrompt = prompt.toLowerCase();

    for (let i = 0; i < injections.length; i++) {
        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (injectionState.challenged) {
            continue;
        }

        if (injectionState.fired) {
            if (!match(normalizedPrompt, injection.challengeMatches)) {
                continue;
            }

            return {
                message: {
                    role: "injection",
                    content: [
                        { type: "text", text: injection.concessionResponse },
                    ],
                },
                index: i,
                isConcession: true,
            };
        }

        if (match(normalizedPrompt, injection.antiMatches)) {
            continue;
        }

        if (!match(normalizedPrompt, injection.matches)) {
            continue;
        }

        return {
            message: {
                role: "injection",
                content: [{ type: "text", text: injection.response }],
            },
            index: i,
            isConcession: false,
        };
    }

    return null;
}
