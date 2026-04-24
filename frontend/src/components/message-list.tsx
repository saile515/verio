import { useEffect, useRef } from "react";
import { Markdown } from "./markdown";
import type { Message } from "../types/session";

function Message({ message }: { message: Message }) {
    const isUser = message.role == "user";

    const content = message.content.map(({ text }) => text).join("");

    return (
        <li className={isUser ? "ml-auto text-right" : ""}>
            <div>{isUser ? "You" : "Verio"}</div>
            <div
                className={`${isUser ? "bg-stone-50 text-stone-900 rounded-tr-none" : "bg-stone-700 rounded-tl-none"} px-4 py-2 rounded-lg`}>
                <Markdown>{content}</Markdown>
            </div>
        </li>
    );
}

export function MessageList({
    messages,
    messagePending,
}: {
    messages: Message[];
    messagePending: boolean;
}) {
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
            {messagePending && (
                <li>
                    <div>Verio</div>
                    <div className="bg-stone-700 rounded-tl-none px-4 py-2 rounded-lg w-fit flex gap-1 h-8 items-center">
                        <div className="size-2 rounded-full animate-bounce bg-stone-50 [animation-delay:-0.3s]" />
                        <div className="size-2 rounded-full animate-bounce bg-stone-50 [animation-delay:-0.15s]" />
                        <div className="size-2 rounded-full animate-bounce bg-stone-50" />
                    </div>
                </li>
            )}
        </ol>
    );
}
