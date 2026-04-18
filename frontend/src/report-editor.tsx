import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    InsertTable,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    Separator,
    UndoRedo,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    tablePlugin,
    toolbarPlugin,
} from "@mdxeditor/editor";
import { useState } from "react";

export function ReportEditor() {
    const [, setValue] = useState("");

    return (
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
    );
}
