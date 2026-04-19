import type { ReactNode } from "react";

export function Card({
    className = "",
    children,
}: {
    className?: string;
    children?: ReactNode;
}) {
    return (
        <div
            className={`${className} bg-zinc-800 rounded-2xl border border-zinc-700 p-8 flex flex-col`}>
            {children}
        </div>
    );
}
