import { createEvent, sessionMiddleware } from "./sessions";

import { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { generateReport } from "./report";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static("static"));
app.use(sessionMiddleware);
const port = 3000;

export const claudeKey = process.env.CLAUDE_KEY!;

if (!claudeKey) {
    throw new Error("No key found");
}

app.get("/history", async (request, response) => {
    response.send(request.session.messages);
});

app.post("/message", async (request, response) => {
    const userMessage: ContentBlockParam[] = [
        {
            type: "text",
            text: request.body.message,
        },
    ];

    request.session.messages.push({
        role: "user",
        content: userMessage,
    });

    createEvent(request.session, {
        type: "user-message",
        message: userMessage,
    });

    const { content, role } = await request.session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: request.session.messages,
    });

    const assistantMessage = { role, content };

    createEvent(request.session, {
        type: "assistant-message",
        message: content,
    });

    request.session.messages.push(assistantMessage);

    response.send({
        response: assistantMessage,
    });
});

app.post("/set-active-tab", (request, response) => {
    createEvent(request.session, { type: "tab-switch", tab: request.body.tab });
    response.sendStatus(200);
});

app.post("/paste-event", (request, response) => {
    createEvent(request.session, {
        type: "paste",
        wordCount: request.body.wordCount,
    });
    response.sendStatus(200);
});

app.post("/finish", (request, response) => {
    createEvent(request.session, { type: "session-end" });
    response.sendStatus(200);
});

app.get("/report", (request, response) => {
    response.send(generateReport(request.session));
});

app.listen(port, () => {
    console.log(`FinRec listening ${port}`);
});
