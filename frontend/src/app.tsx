import { useState, type SubmitEvent } from "react";

async function serverFetch(path: string, method: string, body?: any) {
    return fetch(`/server${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

async function sendMessage(message: string) {
    const response = await serverFetch("/message", "POST", { message });

    const json = await response.json();

    return json.response;
}

async function createSession() {
    await serverFetch("/create-session", "POST");
}

interface Message {
    from: "user" | "system";
    content: string;
}

await createSession();

export function App() {
    const [history, setHistory] = useState<Message[]>([]);

    async function handleMessage(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = new FormData(event.target);

        const message = data.get("message") as string;

        setHistory((previous) => [
            ...previous,
            { from: "user", content: message },
        ]);

        const response = await sendMessage(message);

        setHistory((previous) => [
            ...previous,
            { from: "system", content: response },
        ]);
    }

    return (
        <div className="flex w-full h-screen bg-zinc-900 text-zinc-50 p-8 gap-8">
            <div className="grow bg-zinc-800 rounded-2xl border border-zinc-700 p-8"></div>
            <div className="max-w-lg w-full bg-zinc-800 rounded-2xl border border-zinc-700 p-8 flex flex-col">
                <ol className="flex flex-col grow gap-2">
                    {history.map(({ from, content }, index) => (
                        <li
                            key={index}
                            className={
                                from == "user" ? "ml-auto text-right" : ""
                            }>
                            <div>{from == "user" ? "You" : "FinRec"}</div>
                            <div
                                className={`${from == "user" ? "bg-zinc-50 text-zinc-900 rounded-tr-none" : "bg-zinc-700 rounded-tl-none"} px-4 py-2 rounded-lg`}>
                                {content}
                            </div>
                        </li>
                    ))}
                </ol>
                <form onSubmit={handleMessage} className="flex flex-col">
                    <textarea
                        name="message"
                        className="border border-zinc-600 rounded-lg focus:outline-none focus:border-zinc-50 p-4"
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
}
