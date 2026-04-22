import type { Message } from "../types/session";

export async function serverFetch(path: string, body?: any, method?: string) {
    return fetch(`/server${path}`, {
        method: (method ?? body) ? "POST" : "GET",
        body: body ? JSON.stringify(body) : undefined,
        headers: body
            ? {
                  "Content-Type": "application/json",
              }
            : undefined,
    });
}

export async function createSession(code: string) {
    await serverFetch("/create-session", { code });
}

export async function sendMessage(message: string) {
    const response = await serverFetch("/message", { message });

    return (await response.json()).response as Message;
}

export interface Session {
    created: Date;
    expires: Date;
    messages: Message[];
}

export async function getSession() {
    const response = await serverFetch("/get-session");
    const result = await response.json();
    result.created = new Date(result.created);
    result.expires = new Date(result.expires);
    return result as Session;
}

export async function setActiveTab(tab: number) {
    await serverFetch("/set-active-tab", { tab });
}

export async function pasteEvent(wordCount: number) {
    await serverFetch("/paste-event", { wordCount });
}

export async function submitTest(memo: string) {
    await serverFetch("/submit-test", { memo });
}

export async function getReport() {
    return (await serverFetch("/report")).json();
}
