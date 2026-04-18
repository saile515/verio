import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import { RequestHandler } from "express";
import { claudeKey } from "./main";

export type UserEventType = "tab-switch" | "session-start" | "session-end";

export interface BaseUserEvent {
    type: UserEventType;
    time: number;
}

export interface TabSwitchEvent extends BaseUserEvent {
    type: "tab-switch";
    tab: number;
}

export interface SessionStartEvent extends BaseUserEvent {
    type: "session-start";
}

export interface SessionEndEvent extends BaseUserEvent {
    type: "session-end";
}

export type UserEvent = SessionStartEvent | SessionEndEvent | TabSwitchEvent;

export interface Session {
    client: Anthropic;
    messages: MessageParam[];
    events: UserEvent[];
    locked: boolean;
}

const sessions: Record<string, Session> = {};

function getSession(sessionId: string) {
    if (!sessions[sessionId]) {
        const session: Session = {
            client: new Anthropic(),
            messages: [],
            events: [],
            locked: false,
        };
        session.client.apiKey = claudeKey;
        sessions[sessionId] = session;
        createEvent(session, { type: "session-start" });
    }

    return sessions[sessionId];
}

export const sessionMiddleware: RequestHandler = (request, response, next) => {
    let sessionId = request.cookies["session"];

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        response.cookie("session", sessionId);
    }

    request.session = getSession(sessionId);
    next();
};

type DistributiveOmit<T, K extends keyof any> = T extends T
    ? Omit<T, K>
    : never;

export function createEvent(
    session: Session,
    event: DistributiveOmit<UserEvent, "time">,
) {
    if (session.locked) {
        return false;
    }

    session.events.push({ ...event, time: performance.now() } as UserEvent);

    if (event.type == "session-end") {
        session.locked = true;
    }

    return true;
}
