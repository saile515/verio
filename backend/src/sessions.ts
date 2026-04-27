import Anthropic from "@anthropic-ai/sdk";
import { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import { InjectionState } from "./chat-agent/injection.js";
import { Report } from "./grading/report.js";
import { RequestHandler } from "express";
import { claudeKey } from "./main.js";
import { injections } from "./chat-agent/injections.js";

export type UserEventType =
    | "session-start"
    | "session-end"
    | "tab-switch"
    | "user-message"
    | "assistant-message"
    | "reinforced-assistant-message"
    | "injection-message"
    | "weak-concession-message"
    | "concession-message"
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

export interface Message {
    role: "user" | "assistant";
    content: ContentBlockParam[];
}

export interface UserMessageEvent extends BaseUserEvent {
    type: "user-message";
    message: Message["content"];
}

export interface AssistantMessageEvent extends BaseUserEvent {
    type: "assistant-message";
    message: Message["content"];
}

export interface ReinforcedAssistantMessageEvent extends BaseUserEvent {
    type: "reinforced-assistant-message";
    message: Message["content"];
    index: number;
}

export interface InjectionMessageEvent extends BaseUserEvent {
    type: "injection-message";
    message: Message["content"];
    index: number;
}

export interface ConcessionMessageEvent extends BaseUserEvent {
    type: "concession-message";
    message: Message["content"];
    index: number;
}

export interface WeakConcessionMessageEvent extends BaseUserEvent {
    type: "weak-concession-message";
    message: Message["content"];
    index: number;
}

export interface PasteEvent extends BaseUserEvent {
    type: "paste";
    wordCount: number;
}

export type UserEvent =
    | SessionStartEvent
    | SessionEndEvent
    | TabSwitchEvent
    | UserMessageEvent
    | AssistantMessageEvent
    | ReinforcedAssistantMessageEvent
    | InjectionMessageEvent
    | ConcessionMessageEvent
    | WeakConcessionMessageEvent
    | PasteEvent;

export type MessageEvent =
    | UserMessageEvent
    | AssistantMessageEvent
    | ReinforcedAssistantMessageEvent
    | InjectionMessageEvent
    | ConcessionMessageEvent
    | WeakConcessionMessageEvent;

export type AiResponseEvent =
    | AssistantMessageEvent
    | ReinforcedAssistantMessageEvent
    | InjectionMessageEvent
    | ConcessionMessageEvent
    | WeakConcessionMessageEvent;

export type SessionTelemetryEvent =
    | SessionStartEvent
    | SessionEndEvent
    | TabSwitchEvent
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
    reportPromise?: Promise<Report>;
}

export function isMessageEvent(event: UserEvent): event is MessageEvent {
    return "message" in event;
}

export function isAiResponseEvent(event: UserEvent): event is AiResponseEvent {
    return (
        event.type == "assistant-message" ||
        event.type == "injection-message" ||
        event.type == "concession-message" ||
        event.type == "weak-concession-message" ||
        event.type == "reinforced-assistant-message"
    );
}

export function isSessionTelemetryEvent(
    event: UserEvent,
): event is SessionTelemetryEvent {
    return (
        event.type == "session-start" ||
        event.type == "session-end" ||
        event.type == "tab-switch" ||
        event.type == "paste"
    );
}

export function getTotalAiResponses(events: Session["events"]) {
    return events.filter(isAiResponseEvent).length;
}

export function getFiredInjectionIndexes(session: Session) {
    return session.injectionState
        .map((injection, index) => ({ index, injection }))
        .filter(({ injection }) => injection.fired)
        .map(({ index }) => index);
}

const sessions: Record<string, Session> = {};

export function createSession(code: string) {
    const sessionId = crypto.randomUUID();

    const created = new Date();
    const expires = new Date(created);
    expires.setMinutes(expires.getMinutes() + 30);

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
            concessionIssued: false,
            weakConcessionIssued: false,
            reinforcementIssued: false,
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
