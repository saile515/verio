export interface Message {
    role: "user" | "assistant";
    content: { text: string }[];
}
