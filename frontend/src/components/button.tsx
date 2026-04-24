import type { ComponentProps } from "react";

export function Button({
    className = "",
    type = "button",
    ...props
}: ComponentProps<"button">) {
    return (
        <button
            type={type}
            className={`${className} bg-stone-50 hover:scale-102 transition-transform text-stone-900 rounded-lg font-medium px-4 py-2 flex items-center gap-1 cursor-pointer`}
            {...props}
        />
    );
}
