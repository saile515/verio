import { Session } from "../sessions.js";

export interface BehaviorGrade {
    signals: {
        userMessages: number;
        assistantMessages: number;
        injectionMessages: number;
        pasteEvents: number;
        pastedWords: number;
        followedAssistantFraming: boolean;
    };
    insights: string[];
}

export async function gradeBehavior(session: Session): Promise<BehaviorGrade> {
    const events = session.events ?? [];

    let userMessages = 0;
    let assistantMessages = 0;
    let injectionMessages = 0;
    let pasteEvents = 0;
    let pastedWords = 0;

    for (const event of events) {
        if (event.type === "user-message") userMessages++;
        if (event.type === "assistant-message") assistantMessages++;
        if (event.type === "injection-message") injectionMessages++;

        if (event.type === "paste") {
            pasteEvents++;
            pastedWords += event.wordCount ?? 0;
        }
    }

    const followedAssistantFraming = events.some(
        (event, index) =>
            event.type === "assistant-message" &&
            events[index + 1]?.type === "user-message",
    );

    const insights: string[] = [];

    if (userMessages < 2) {
        insights.push("Limited interaction before forming conclusion");
    }

    if (injectionMessages > 0) {
        insights.push("User was exposed to injected signals during the test");
    }

    if (followedAssistantFraming) {
        insights.push("User may have followed assistant framing closely");
    } else {
        insights.push("User showed limited direct reliance on assistant framing");
    }

    if (pastedWords > 100) {
        insights.push("Significant pasted content detected");
    }

    return {
        signals: {
            userMessages,
            assistantMessages,
            injectionMessages,
            pasteEvents,
            pastedWords,
            followedAssistantFraming,
        },
        insights,
    };
}