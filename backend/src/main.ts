import { createEvent, createSession, sessionMiddleware } from "./sessions.js";
import express, { Errback, NextFunction, Request, Response } from "express";

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { generateReport } from "./report.js";
import { userMessage } from "./chat-agent/user-messaging.js";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.static(`${process.cwd()}/static`));
app.use(
    (
        rawError: unknown,
        _request: Request,
        response: Response,
        _next: NextFunction,
    ) => {
        console.error(rawError);

        const isDev = process.env.NODE_ENV === "development";

        const error =
            rawError instanceof Error ? rawError : new Error("Unknown error");

        response.status(500).json({
            message: "Internal Server Error",
            ...(isDev ? { stack: error.stack } : {}),
        });
    },
);
const port = 3000;

export const claudeKey = process.env.CLAUDE_KEY!;

if (!claudeKey) {
    throw new Error("No key found");
}

app.post("/create-session", async (request, response) => {
    const sessionId = createSession(request.body.code);
    response.cookie("session", sessionId);
    response.sendStatus(201);
});

app.get("/get-session", sessionMiddleware, async (request, response) => {
    const { messages, created, expires } = request.session;
    response.send({ messages, created, expires });
});

app.post("/message", sessionMiddleware, async (request, response) => {
    response.send({
        response: await userMessage(request.session, request.body.message),
    });
});

app.post("/set-active-tab", sessionMiddleware, (request, response) => {
    createEvent(request.session, { type: "tab-switch", tab: request.body.tab });
    response.sendStatus(200);
});

app.post("/paste-event", sessionMiddleware, (request, response) => {
    createEvent(request.session, {
        type: "paste",
        wordCount: request.body.wordCount,
    });
    response.sendStatus(200);
});

app.post("/submit-test", sessionMiddleware, (request, response) => {
    createEvent(request.session, { type: "session-end" });
    request.session.memo = request.body.memo;
    response.sendStatus(200);
});

app.get("/report", sessionMiddleware, async (request, response) => {
    response.send(await generateReport(request.session));
});

app.listen(port, () => {
    console.log(`Verio listening ${port}`);
});
