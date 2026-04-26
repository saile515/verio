import type { ChangeEvent, ComponentProps, FC, JSX } from "react";

export type InputProps<
    T,
    Component extends FC | keyof JSX.IntrinsicElements,
> = Omit<ComponentProps<Component>, "value" | "onChange"> & {
    value: T;
    onChange: (value: T, event?: ChangeEvent) => unknown;
};

const inputClassName =
    "border border-stone-600 rounded-lg focus:outline-none focus:border-lime-200 px-3 py-2 w-full";

export function TextInput({
    type,
    onChange,
    className = "",
    ...props
}: InputProps<string, "input">) {
    return (
        <input
            className={`${inputClassName} ${className}`}
            type="text"
            onChange={(event) => onChange(event.target.value, event)}
            {...props}
        />
    );
}

export function TextAreaInput({
    onChange,
    className,
    ...props
}: InputProps<string, "textarea">) {
    return (
        <textarea
            className={`${inputClassName} ${className}`}
            onChange={(event) => onChange(event.target.value, event)}
            {...props}
        />
    );
}
