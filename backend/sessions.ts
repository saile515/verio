import { ContentBlockParam, MessageParam } from "@anthropic-ai/sdk/resources";
import { InjectionState, injections } from "./chat-agent/injection";

import Anthropic from "@anthropic-ai/sdk";
import { Report } from "./report";
import { RequestHandler } from "express";
import { claudeKey } from "./main";

export type UserEventType =
    | "session-start"
    | "session-end"
    | "tab-switch"
    | "user-message"
    | "assistant-message"
    | "injection-message"
    | "paste";

export interface BaseUserEvent {
    type: UserEventType;
    time: number;
}

export interface SessionStartEvent extends BaseUserEvent {
    type: "session-start";
}

export interface SessionEndEvent extends BaseUserEvent {
    type: "session-end";
}

export interface TabSwitchEvent extends BaseUserEvent {
    type: "tab-switch";
    tab: number;
}

export interface UserMessageEvent extends BaseUserEvent {
    type: "user-message";
    message: ContentBlockParam[];
}

export interface AssistantMessageEvent extends BaseUserEvent {
    type: "assistant-message";
    message: ContentBlockParam[];
}

export interface InjectionMessageEvent extends BaseUserEvent {
    type: "injection-message";
    message: ContentBlockParam[];
    index: number;
    isConcession: boolean;
}

export interface PasteEvent extends BaseUserEvent {
    type: "paste";
    wordCount: number;
}

export interface Message {
    role: "user" | "assistant" | "injection";
    content: ContentBlockParam[];
}

export type UserEvent =
    | SessionStartEvent
    | SessionEndEvent
    | TabSwitchEvent
    | UserMessageEvent
    | AssistantMessageEvent
    | InjectionMessageEvent
    | PasteEvent;

export interface Session {
    client: Anthropic;
    messages: Message[];
    events: UserEvent[];
    locked: boolean;
    injectionState: InjectionState[];
    memo?: string;
    report?: Report;
}

const sessions: Record<string, Session> = {};

function getSession(sessionId: string) {
    if (!sessions[sessionId]) {
        const session: Session = {
            client: new Anthropic(),
            messages: [],
            events: [],
            locked: false,
            injectionState: injections.map(() => ({
                fired: false,
                challenged: false,
            })),
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
