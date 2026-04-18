import { Session } from "./sessions";

export interface Report {
    tabTime: number[];
}

export function generateReport(session: Session) {
    const result: Report = {
        tabTime: new Array(5).fill(0),
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
            case "session-end":
                if (activeTab != null && lastTabSwitch != null) {
                    result.tabTime[activeTab] += event.time - lastTabSwitch;
                }
                break;
        }
    }

    return result;
}
