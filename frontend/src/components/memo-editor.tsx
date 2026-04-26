import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    InsertTable,
    ListsToggle,
    MDXEditor,
    Separator,
    UndoRedo,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    tablePlugin,
    toolbarPlugin,
} from "@mdxeditor/editor";
import { pasteEvent, submitTest } from "../lib/server";
import { useEffect, useRef } from "react";

import { Button } from "./button";
import { useNavigate } from "react-router";

export function MemoEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handlePaste(event: ClipboardEvent) {
            if (!ref.current?.contains(event.target as Element)) {
                return;
            }

            const wordCount = event.clipboardData
                ?.getData("text/plain")
                .split(" ").length;

            if (!wordCount) {
                return;
            }

            pasteEvent(wordCount);
        }

        addEventListener("paste", handlePaste);

        return () => removeEventListener("paste", handlePaste);
    }, []);

    async function handleSubmit() {
        await submitTest(value);
        navigate("/report");
    }

    return (
        <div className="h-full flex flex-col" ref={ref}>
            <MDXEditor
                className="dark grow overflow-hidden flex flex-col"
                markdown={value}
                onChange={onChange}
                contentEditableClassName="h-full overflow-auto"
                plugins={[
                    toolbarPlugin({
                        toolbarContents: () => (
                            <div className="h-full flex">
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <Separator />
                                <ListsToggle />
                                <Separator />
                                <BlockTypeSelect />
                                <Separator />
                                <InsertTable />
                            </div>
                        ),
                    }),
                    tablePlugin(),
                    headingsPlugin(),
                    quotePlugin(),
                    listsPlugin(),
                ]}
            />
            <Button className="ml-auto mt-1" onClick={handleSubmit}>
                Submit assignment
            </Button>
        </div>
    );
}
