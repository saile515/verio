import type { Message } from "./types";

export async function serverFetch(path: string, method: string, body?: any) {
    return fetch(`/server${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: body
            ? {
                  "Content-Type": "application/json",
              }
            : undefined,
    });
}

export async function sendMessage(message: string) {
    const response = await serverFetch("/message", "POST", { message });

    return (await response.json()).response as Message;
}

export async function createSession() {
    await serverFetch("/create-session", "POST");
}

export async function getHistory() {
    const response = await serverFetch("/history", "GET");
    return response.json() as Promise<Message[]>;
}
