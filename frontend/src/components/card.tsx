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
            className={`${className} bg-stone-800 rounded-2xl border border-stone-700 p-8 flex flex-col`}>
            {children}
        </div>
    );
}
