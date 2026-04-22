import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { useState, type SubmitEvent } from "react";
import type { Message } from "../lib/types";
import { MessageList } from "../components/message-list";
import { getHistory, sendMessage, serverFetch } from "../lib/server";
import { TabViewer, type Tab } from "../components/tab-viewer";
import { Markdown } from "../components/markdown";
import { MemoEditor } from "../components/memo-editor";
import { Card } from "../components/card";

async function getFile(name: string) {
    return await serverFetch(`/files/${name}`).then((res) => res.text());
}

const tabs: Tab[] = [
    {
        tabName: "Intro",
        content: <Markdown>{await getFile("intro.md")}</Markdown>,
    },
    {
        tabName: "Exhibit A",
        content: <Markdown>{await getFile("exhibit-a.md")}</Markdown>,
    },
    {
        tabName: "Exhibit B",
        content: <Markdown>{await getFile("exhibit-b.md")}</Markdown>,
    },
    {
        tabName: "Exhibit C",
        content: <Markdown>{await getFile("exhibit-c.md")}</Markdown>,
    },
    {
        tabName: "Exhibit D",
        content: <Markdown>{await getFile("exhibit-d.md")}</Markdown>,
    },
    {
        tabName: "Memo",
        content: <MemoEditor />,
    },
];

const initialHistory = await getHistory();

export function Test() {
    const [history, setHistory] = useState<Message[]>(initialHistory);
    const [message, setMessage] = useState("");
    const [messagePending, setMessagePending] = useState(false);

    async function handleMessage(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setHistory((previous) => [
            ...previous,
            { role: "user", content: [{ text: message }] },
        ]);

        setMessage("");
        setMessagePending(true);

        const response = await sendMessage(message).catch(() => undefined);

        if (response) {
            setHistory((previous) => [...previous, response]);
        }

        setMessagePending(false);
    }

    return (
        <div className="flex w-full h-screen bg-zinc-900 text-zinc-50 p-8 gap-8">
            <TabViewer tabs={tabs} />
            <Card className="max-w-xl w-full gap-4">
                <MessageList
                    messages={history}
                    messagePending={messagePending}
                />
                <form onSubmit={handleMessage} className="flex flex-col">
                    <textarea
                        className="border border-zinc-600 rounded-lg focus:outline-none focus:border-zinc-200 p-4"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key == "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                (
                                    event.target as HTMLTextAreaElement
                                ).form?.requestSubmit();
                            }
                        }}
                    />
                    <button
                        type="submit"
                        className="bg-zinc-50 text-gray-900 rounded-lg mt-1 ml-auto font-medium pl-4 pr-3 py-2 flex items-center gap-1">
                        Send
                        <PaperAirplaneIcon className="size-5" />
                    </button>
                </form>
            </Card>
        </div>
    );
}
