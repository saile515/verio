import { useEffect, useState, type ReactNode } from "react";

import { setActiveTab } from "../lib/server";
import { Card } from "./card";

export interface Tab {
    tabName: string;
    content: ReactNode;
}

function Timer({ expires }: { expires: Date }) {
    const [minutesLeft, setMinutesLeft] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        function updateTime() {
            const timeLeft = Math.floor(
                (expires.getTime() - Date.now()) / 1000,
            );
            setMinutesLeft(Math.floor(timeLeft / 60));
            setSecondsLeft(timeLeft % 60);
        }

        const interval = setInterval(updateTime, 1000);

        updateTime();

        return () => clearInterval(interval);
    }, [expires]);

    return (
        <div className="ml-auto text-xl">
            <span className="text-stone-400">Time left:</span>{" "}
            <span className="text-lime-200 font-medium">
                {minutesLeft}:{secondsLeft.toString().padStart(2, "0")}
            </span>
        </div>
    );
}

export function TabViewer({ tabs, expires }: { tabs: Tab[]; expires: Date }) {
    const [activeTab, setActiveTabState] = useState<number>(0);

    useEffect(() => {
        setActiveTab(activeTab);
    }, [activeTab]);

    return (
        <div className="grow flex flex-col gap-2 h-full">
            <div className="flex gap-2 flex-wrap">
                {tabs.map(({ tabName: filename }, index) => (
                    <button
                        key={filename}
                        onClick={() => setActiveTabState(index)}
                        className={`${index == activeTab ? "border-b-2 border-lime-200 rounded-b-none" : "hover:border-b-2 border-lime-100"} transition-[border] duration-100 bg-stone-800 px-2 py-1 rounded whitespace-nowrap`}>
                        {filename}
                    </button>
                ))}
                <Timer expires={expires} />
            </div>
            <Card className="grow overflow-auto">
                {tabs[activeTab]?.content}
            </Card>
        </div>
    );
}
