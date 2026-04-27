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
import type { Message } from "../types/session";

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

function Chat({ session }: { session: Session }) {
    const [history, setHistory] = useState<Message[]>(session.messages);
    const [message, setMessage] = useState("");
    const [memo, setMemo] = useState("");
    const [messagePending, setMessagePending] = useState(false);

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

    return (
        <>
            <MessageList messages={history} messagePending={messagePending} />
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
                <Button type="submit" className="mt-1 ml-auto">
                    Send
                    <PaperAirplaneIcon className="size-5" />
                </Button>
            </form>
        </>
    );
}

export function Test() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        getSession().then((session) => {
            setSession(session);
        });
    }, []);

    if (!session) {
        return;
    }

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
            content: <MemoEditor value={memo} onChange={setMemo} />,
        },
        ...(window.innerWidth < 1024
            ? [{ tabName: "Chat", content: <Chat session={session} /> }]
            : []),
    ];

    return (
        <div className="flex not-lg:flex-col w-full h-screen grow gap-8 p-4 lg:p-8 overflow-hidden">
            <TabViewer tabs={tabs} expires={session.expires} />
            <Card className="max-w-xl size-full gap-4 not-lg:hidden">
                <Chat session={session} />
            </Card>
        </div>
    );
}
