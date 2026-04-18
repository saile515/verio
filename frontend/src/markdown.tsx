import type { ComponentProps } from "react";
import MarkdownContainer from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({
    ...props
}: ComponentProps<typeof MarkdownContainer>) {
    return (
        <MarkdownContainer
            remarkPlugins={[remarkGfm]}
            components={{
                td: (props) => (
                    <td
                        className="border border-zinc-50 px-2 py-1"
                        {...props}
                    />
                ),
                p: (props) => (
                    <p className="my-4 first:mt-0 last:mb-0" {...props} />
                ),
                ul: (props) => (
                    <ul className="list-disc list-inside" {...props} />
                ),
            }}
            {...props}
        />
    );
}
