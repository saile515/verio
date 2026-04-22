import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { useEffect, useState, type SubmitEvent } from "react";
import { MessageList } from "../components/message-list";
import {
    getSession,
    sendMessage,
    serverFetch,
    type Session,
} from "../lib/server";
import { TabViewer, type Tab } from "../components/tab-viewer";
import { Markdown } from "../components/markdown";
import { MemoEditor } from "../components/memo-editor";
import { Card } from "../components/card";
import { Button } from "../components/button";
import { TextAreaInput } from "../components/input";
import type { Message } from "@backend/sessions";

async function getFile(name: string) {
    return await serverFetch(`/files/${name}`).then((res) => res.text());
}

const files = [
    await getFile("intro.md"),
    await getFile("exhibit-a.md"),
    await getFile("exhibit-b.md"),
    await getFile("exhibit-c.md"),
    await getFile("exhibit-d.md"),
];

export function Test() {
    const [session, setSession] = useState<Session | null>(null);
    const [history, setHistory] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [messagePending, setMessagePending] = useState(false);

    useEffect(() => {
        getSession().then((session) => {
            setSession(session);
            setHistory(session.messages);
        });
    }, []);

    const tabs: Tab[] = [
        {
            tabName: "Intro",
            content: <Markdown>{files[0]}</Markdown>,
        },
        {
            tabName: "Exhibit A",
            content: <Markdown>{files[1]}</Markdown>,
        },
        {
            tabName: "Exhibit B",
            content: <Markdown>{files[2]}</Markdown>,
        },
        {
            tabName: "Exhibit C",
            content: <Markdown>{files[3]}</Markdown>,
        },
        {
            tabName: "Exhibit D",
            content: <Markdown>{files[4]}</Markdown>,
        },
        {
            tabName: "Memo",
            content: <MemoEditor />,
        },
    ];

    async function handleMessage(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setHistory((previous) => [
            ...previous,
            { role: "user", content: [{ type: "text", text: message }] },
        ]);

        setMessage("");
        setMessagePending(true);

        const response = await sendMessage(message).catch(() => undefined);

        if (response) {
            setHistory((previous) => [...previous, response]);
        }

        setMessagePending(false);
    }

    if (!session) {
        return;
    }

    return (
        <div className="flex w-full grow gap-8">
            <TabViewer tabs={tabs} expires={session.expires} />
            <Card className="max-w-xl w-full gap-4">
                <MessageList
                    messages={history}
                    messagePending={messagePending}
                />
                <form onSubmit={handleMessage} className="flex flex-col">
                    <TextAreaInput
                        value={message}
                        onChange={setMessage}
                        onKeyDown={(event) => {
                            if (event.key == "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                (
                                    event.target as HTMLTextAreaElement
                                ).form?.requestSubmit();
                            }
                        }}
                    />
                    <Button type="submit">
                        Send
                        <PaperAirplaneIcon className="size-5" />
                    </Button>
                </form>
            </Card>
        </div>
    );
}
