export interface Message {
    role: "user" | "assistant";
    content: { text: string }[];
}

export interface Session {
    created: Date;
    expires: Date;
    messages: Message[];
}
