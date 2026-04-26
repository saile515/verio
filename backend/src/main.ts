import "dotenv/config";

import { createEvent, createSession, sessionMiddleware } from "./sessions.js";
import express, { NextFunction, Request, Response } from "express";

import cookieParser from "cookie-parser";
import { generateReport } from "./grading/report.js";
import { userMessage } from "./chat-agent/user-messaging.js";

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
    if (!request.session.locked) {
        response.sendStatus(403);
        return;
    }

    response.send(
        request.session.report ?? (await generateReport(request.session)),
    );
});

app.listen(port, () => {
    console.log(`Verio listening ${port}`);
});
