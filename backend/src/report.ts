import { MemoQuality, gradeMemo } from "./grading/memo.js";

import { Session } from "./sessions.js";

export interface Report {
    tabTime: number[];
    pastedWords: number;
    memoQuality?: MemoQuality;
}

export async function generateReport(session: Session) {
    const result: Report = {
        tabTime: new Array(5).fill(0),
        pastedWords: 0,
        memoQuality: await gradeMemo(session),
    };

    let activeTab: number | null = null;
    let lastTabSwitch: number | null = null;

    for (const event of session.events) {
        switch (event.type) {
            case "tab-switch":
                if (activeTab != null && lastTabSwitch != null) {
                    result.tabTime[event.tab] += event.time - lastTabSwitch;
                }

                activeTab = event.tab;
                lastTabSwitch = event.time;
                break;
            case "paste":
                result.pastedWords += event.wordCount;
                break;
            case "session-end":
                if (activeTab != null && lastTabSwitch != null) {
                    result.tabTime[activeTab] += event.time - lastTabSwitch;
                }
                break;
        }
    }

    session.report = result;

    return result;
}
