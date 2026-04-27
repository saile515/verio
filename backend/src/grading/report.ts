import { BehaviorGrade, gradeBehavior } from "./behavior.js";
import { MemoGrade, gradeMemo } from "./memo.js";
import { Verdict, getVerdict } from "./verdict.js";

import { Session } from "../sessions.js";

export interface Report {
    tabTime: number[];
    pastedWords: number;
    memo?: MemoGrade;
    behavior?: BehaviorGrade;
    verdict?: Verdict;
}

export async function generateReport(session: Session) {
    const result: Report = {
        tabTime: new Array(5).fill(0),
        pastedWords: 0,
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

    const reportMetrics = {
        tabTime: result.tabTime,
        pastedWords: result.pastedWords,
    };

    result.memo = await gradeMemo(session);
    result.behavior = await gradeBehavior(session, result.memo);
    result.verdict = await getVerdict(
        session,
        result.behavior,
        result.memo,
        reportMetrics,
    );

    return result;
}
