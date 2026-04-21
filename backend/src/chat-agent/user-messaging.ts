import { ContentBlockParam, MessageParam } from "@anthropic-ai/sdk/resources";
import { Session, createEvent } from "../sessions.js";

import { inject } from "./injection.js";
import { loadSystemPrompt } from "../system-prompts/util.js";

const agentPrompt = loadSystemPrompt("assistant");

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
        await new Promise((resolve) =>
            setTimeout(resolve, 3000 + (Math.random() - 0.5) * 2000),
        );

        createEvent(session, {
            type: "injection-message",
            message: injection.message.content,
            index: injection.index,
            isConcession: injection.isConcession,
            isWeak: injection.isWeak,
        });

        session.messages.push(injection.message);
        return injection.message;
    }

    const message = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        cache_control: { type: "ephemeral" },
        system: agentPrompt,
        messages: session.messages,
    });

    createEvent(session, {
        type: "assistant-message",
        message: message.content,
    });

    session.messages.push({ content: message.content, role: message.role });

    return message;
}
