import { InjectionState, injections } from "./chat-agent/injection.js";

import Anthropic from "@anthropic-ai/sdk";
import { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import { Report } from "./report.js";
import { RequestHandler } from "express";
import { claudeKey } from "./main.js";

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
    isWeak: boolean;
}

export interface PasteEvent extends BaseUserEvent {
    type: "paste";
    wordCount: number;
}

export interface Message {
    role: "user" | "assistant";
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
    created: Date;
    expires: Date;
    code: string;
    client: Anthropic;
    messages: Message[];
    events: UserEvent[];
    locked: boolean;
    injectionState: InjectionState[];
    memo?: string;
    report?: Report;
}

const sessions: Record<string, Session> = {};

export function createSession(code: string) {
    const sessionId = crypto.randomUUID();

    const created = new Date();
    const expires = new Date(created);
    expires.setMinutes(expires.getMinutes() + 15);

    const session: Session = {
        created,
        expires,
        code,
        client: new Anthropic(),
        messages: [],
        events: [],
        locked: false,
        injectionState: injections.map(() => ({
            fired: false,
            resolved: false,
            concessionIssued: false,
            weakConcessionCount: 0,
            fireCount: 0,
        })),
    };

    session.client.apiKey = claudeKey;
    sessions[sessionId] = session;
    createEvent(session, { type: "session-start" });

    return sessionId;
}

export const sessionMiddleware: RequestHandler = (request, response, next) => {
    const sessionId = request.cookies["session"];

    if (!sessionId || !sessions[sessionId]) {
        response.sendStatus(401);
        return;
    }

    request.session = sessions[sessionId];
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
