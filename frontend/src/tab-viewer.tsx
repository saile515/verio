import { useEffect, useState, type ReactNode } from "react";

import { setActiveTab } from "./server";
import { Card } from "./card";

export interface Tab {
    tabName: string;
    content: ReactNode;
}

export function TabViewer({ tabs }: { tabs: Tab[] }) {
    const [activeTab, setActiveTabState] = useState<number>(0);

    useEffect(() => {
        setActiveTab(activeTab);
    }, [activeTab]);

    return (
        <div className="grow flex flex-col gap-2">
            <ul className="flex gap-2">
                {tabs.map(({ tabName: filename }, index) => (
                    <li key={filename}>
                        <button
                            onClick={() => setActiveTabState(index)}
                            className={`${index == activeTab ? "bg-zinc-600" : "bg-zinc-800"} px-2 py-1 rounded`}>
                            {filename}
                        </button>
                    </li>
                ))}
            </ul>
            <Card className="grow overflow-auto">
                {tabs[activeTab]?.content}
            </Card>
        </div>
    );
}
