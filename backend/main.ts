import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static("static"));
const port = 3000;

interface Session {
    client: Anthropic;
    messages: MessageParam[];
}

const sessions: Record<string, Session> = {};

const claudeKey = process.env.CLAUDE_KEY!;

if (!claudeKey) {
    throw new Error("No key found");
}

function getSession(sessionId: string) {
    if (!sessions[sessionId]) {
        const session = {
            client: new Anthropic(),
            messages: [],
        };
        session.client.apiKey = claudeKey;
        sessions[sessionId] = session;
    }

    return sessions[sessionId];
}

async function createMessage(sessionId: string, prompt: string) {
    const session = getSession(sessionId);

    session.messages.push({
        role: "user",
        content: [{ type: "text", text: prompt }],
    });

    const response = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: session.messages,
    });

    const message = { role: response.role, content: response.content };

    session.messages.push(message);

    return message;
}

async function getHistory(sessionId: string) {
    return getSession(sessionId).messages;
}

app.post("/create-session", (request, response) => {
    if (request.cookies["session"]) {
        response.sendStatus(200);
        return;
    }

    response.cookie("session", crypto.randomUUID());
    response.sendStatus(200);
});

app.get("/history", async (request, response) => {
    const sessionId = request.cookies["session"];

    if (!sessionId) {
        response.sendStatus(401);
        return;
    }

    const history = await getHistory(sessionId);

    response.send(history);
});

app.post("/message", async (request, response) => {
    const sessionId = request.cookies["session"];

    if (!sessionId) {
        response.sendStatus(401);
        return;
    }

    response.status(200);
    response.send({
        response: await createMessage(sessionId, request.body.message),
    });
});

app.listen(port, () => {
    console.log(`FinRec listening ${port}`);
});
