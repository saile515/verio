import { useEffect, useRef } from "react";
import { Markdown } from "./markdown";
import type { Message } from "./types";

function Message({ message }: { message: Message }) {
    const isUser = message.role == "user";

    const content = message.content.map(({ text }) => text).join("");

    return (
        <li className={isUser ? "ml-auto text-right" : ""}>
            <div>{isUser ? "You" : "FinRec"}</div>
            <div
                className={`${isUser ? "bg-zinc-50 text-zinc-900 rounded-tr-none" : "bg-zinc-700 rounded-tl-none"} px-4 py-2 rounded-lg`}>
                <Markdown>{content}</Markdown>
            </div>
        </li>
    );
}

export function MessageList({ messages }: { messages: Message[] }) {
    const messageContainerRef = useRef<HTMLOListElement>(null);

    function scrollToBottom() {
        messageContainerRef.current?.scrollTo({
            top: messageContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    }

    useEffect(scrollToBottom, [messages]);

    return (
        <ol
            className="flex flex-col grow gap-2 overflow-scroll"
            ref={messageContainerRef}>
            {messages.map((message, index) => (
                <Message message={message} key={index} />
            ))}
        </ol>
    );
}
