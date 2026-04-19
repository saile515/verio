import { createEvent, sessionMiddleware } from "./sessions";

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { generateReport } from "./report";
import { userMessage } from "./user-messaging";

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
    response.send({
        response: await userMessage(request.session, request.body.message),
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
    request.session.memo = request.body.memo;
    response.sendStatus(200);
});

app.get("/report", async (request, response) => {
    response.send(await generateReport(request.session));
});

app.listen(port, () => {
    console.log(`FinRec listening ${port}`);
});
