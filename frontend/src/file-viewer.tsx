import { Markdown } from "./markdown";
import { useState } from "react";

export interface File {
    filename: string;
    content: string;
}

export function FileViewer({ files }: { files: File[] }) {
    const [activeFile, setActiveFile] = useState(files[0]?.filename!);

    return (
        <div className="grow flex flex-col gap-2">
            <ul className="flex gap-2">
                {files.map(({ filename }) => (
                    <li key={filename}>
                        <button
                            onClick={() => setActiveFile(filename)}
                            className={`${filename == activeFile ? "bg-zinc-600" : "bg-zinc-800"} px-2 py-1 rounded`}>
                            {filename}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8 grow overflow-auto">
                <Markdown>
                    {files.find((file) => file.filename == activeFile)?.content}
                </Markdown>
            </div>
        </div>
    );
}
