import { Session } from "../sessions.js";

export interface Verdict {
    recommendation: string;
    summary: string;
    strengths: string[];
    risks: string[];
    signals: {
        userMessages: number;
        assistantMessages: number;
        injectionMessages: number;
        pasteEvents: number;
        pastedWords: number;
        followedAssistantFraming: boolean;
    };
}

export async function getVerdict(session: Session): Promise<Verdict> {
    const events = session.events ?? [];
    const memo = (session as any).memo ?? "";

    const userMessages = events.filter((e: any) => e.type === "user-message").length;
    const assistantMessages = events.filter((e: any) => e.type === "assistant-message").length;
    const injectionMessages = events.filter((e: any) => e.type === "injection-message").length;
    const pasteEvents = events.filter((e: any) => e.type === "paste").length;

    const pastedWords = events
        .filter((e: any) => e.type === "paste")
        .reduce((sum: number, e: any) => sum + (e.wordCount ?? 0), 0);

    const memoText = typeof memo === "string" ? memo.toLowerCase() : "";

    const hasRecommendation =
        memoText.includes("recommend") ||
        memoText.includes("invest") ||
        memoText.includes("do not invest") ||
        memoText.includes("yes") ||
        memoText.includes("no");

    const mentionsValuation =
        memoText.includes("valuation") ||
        memoText.includes("multiple") ||
        memoText.includes("arr");

    const mentionsTradeoff =
        memoText.includes("however") ||
        memoText.includes("but") ||
        memoText.includes("risk") ||
        memoText.includes("tradeoff");

    const mentionsSpecificFigures = /\d/.test(memoText);

    const followedAssistantFraming = events.some(
        (event: any, index: number) =>
            event.type === "assistant-message" &&
            events[index + 1]?.type === "user-message"
    );

    const strengths: string[] = [];
    const risks: string[] = [];

    if (mentionsSpecificFigures) {
        strengths.push("Uses specific data points in the final memo");
    } else {
        risks.push("Final memo lacks specific figures");
    }

    if (hasRecommendation) {
        strengths.push("Includes a clear directional recommendation");
    } else {
        risks.push("No clear investment recommendation detected");
    }

    if (mentionsValuation) {
        strengths.push("Addresses valuation or ARR");
    } else {
        risks.push("Does not clearly address valuation");
    }

    if (mentionsTradeoff) {
        strengths.push("Acknowledges risk or tradeoffs");
    } else {
        risks.push("Limited explicit tradeoff reasoning");
    }

    if (userMessages >= 2) {
        strengths.push("Engaged with the assistant before submitting");
    } else {
        risks.push("Limited interaction before final submission");
    }

    if (injectionMessages > 0 && followedAssistantFraming) {
        risks.push("May have relied closely on assistant framing after injected signals");
    }

    if (pastedWords > 100) {
        risks.push("Significant pasted content detected");
    }

    let recommendation = "Needs review";

    if (
        hasRecommendation &&
        mentionsSpecificFigures &&
        mentionsValuation &&
        mentionsTradeoff &&
        userMessages >= 2
    ) {
        recommendation = "Strong candidate signal";
    } else if (
        hasRecommendation &&
        (mentionsSpecificFigures || mentionsValuation) &&
        mentionsTradeoff
    ) {
        recommendation = "Moderate candidate signal";
    } else {
        recommendation = "Weak candidate signal";
    }

    return {
        recommendation,
        summary:
            "Verdict combines memo quality with behavioral signals from the session.",
        strengths,
        risks,
        signals: {
            userMessages,
            assistantMessages,
            injectionMessages,
            pasteEvents,
            pastedWords,
            followedAssistantFraming,
        },
    };
}