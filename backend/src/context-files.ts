import { readFileSync } from "node:fs";

export const contextFiles = [
    readFileSync(`${process.cwd()}/static/files/exhibit-a.md`, "utf-8"),
    readFileSync(`${process.cwd()}/static/files/exhibit-b.md`, "utf-8"),
    readFileSync(`${process.cwd()}/static/files/exhibit-c.md`, "utf-8"),
    readFileSync(`${process.cwd()}/static/files/exhibit-d.md`, "utf-8"),
].map((file) => ({
    type: "text" as const,
    text: file,
}));
