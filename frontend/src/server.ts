import type { Message } from "./types";

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

export async function sendMessage(message: string) {
    const response = await serverFetch("/message", { message });

    return (await response.json()).response as Message;
}

export async function createSession() {
    await serverFetch("/create-session", undefined, "POST");
}

export async function getHistory() {
    const response = await serverFetch("/history");
    return response.json() as Promise<Message[]>;
}
