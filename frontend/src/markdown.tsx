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
                th: (props) => (
                    <th
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
                li: (props) => <li className="my-2" {...props} />,
                h1: (props) => <h1 className="text-3xl" {...props} />,
                h2: (props) => <h2 className="text-xl mt-4" {...props} />,
                h3: (props) => <h2 className="text-lg mt-2" {...props} />,
                h4: (props) => <h2 className="font-medium mt-2" {...props} />,
            }}
            {...props}
        />
    );
}
