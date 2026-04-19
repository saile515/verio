import { Session, createEvent } from "./sessions";

import { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import { readFileSync } from "node:fs";

export const contextFiles = [
    readFileSync("./static/files/exhibit-a.md", "utf-8"),
    readFileSync("./static/files/exhibit-b.md", "utf-8"),
    readFileSync("./static/files/exhibit-c.md", "utf-8"),
    readFileSync("./static/files/exhibit-d.md", "utf-8"),
].map((file) => ({
    type: "text" as const,
    text: file,
}));

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

    const { content, role } = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        cache_control: { type: "ephemeral" },
        system: contextFiles,
        messages: session.messages,
    });

    const assistantMessage = { role, content };

    createEvent(session, {
        type: "assistant-message",
        message: content,
    });

    session.messages.push(assistantMessage);

    return assistantMessage;
}
