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
import { useEffect, useRef, useState } from "react";

import { Button } from "./button";
import { useNavigate } from "react-router";

export function MemoEditor() {
    const [value, setValue] = useState("");
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
                markdown=""
                onChange={setValue}
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
