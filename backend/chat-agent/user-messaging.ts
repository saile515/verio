import { ContentBlockParam, MessageParam } from "@anthropic-ai/sdk/resources";
import { Session, createEvent } from "../sessions";

import { contextFiles } from "../context-files";
import { inject } from "./injection";

export async function userMessage(session: Session, prompt: string) {
    const userMessage: ContentBlockParam[] = [
        {
            type: "text",
            text: prompt,
        },
    ];

    session.messages.push({
        role: "user",
        content: userMessage,
    });

    createEvent(session, {
        type: "user-message",
        message: userMessage,
    });

    const injection = inject(session, prompt);

    if (injection) {
        createEvent(session, {
            type: "injection-message",
            message: injection.message.content,
            index: injection.index,
            isConcession: injection.isConcession,
        });

        session.messages.push(injection.message);
        return;
    }

    const message = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        cache_control: { type: "ephemeral" },
        system: contextFiles,
        messages: session.messages.map((message) =>
            message.role == "injection"
                ? { ...message, role: "assistant" }
                : message,
        ) as MessageParam[],
    });

    createEvent(session, {
        type: "assistant-message",
        message: message.content,
    });

    session.messages.push(message);

    return message;
}
