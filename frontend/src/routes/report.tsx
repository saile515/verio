import { useEffect, useState } from "react";

import { Card } from "../components/card";
import { RadarChart } from "../components/radar-chart";
import { getReport } from "../lib/server";
import type { Criteria, Report } from "../types/report";

function Criteria({ metric, label }: { metric: Criteria; label: string }) {
    return (
        <Card className="max-w-lg">
            <div className="flex items-center mb-2">
                <h2 className="text-xl">{label}</h2>
                <div
                    className="ml-auto size-12 p-1 rounded-full shrink-0 -mt-4"
                    style={{
                        background: `conic-gradient(var(--color-blue-600) ${metric.result.score * 100}%, var(--color-zinc-900) ${metric.result.score * 100}%)`,
                    }}>
                    <div className="size-full bg-zinc-800 rounded-full flex items-center justify-center font-bold text-lg">
                        {Math.round(metric.result.score * 100) / 10}
                    </div>
                </div>
            </div>
            {metric.result.evidence}
        </Card>
    );
}

export function Report() {
    const [report, setReport] = useState<Report | null>(null);

    useEffect(() => {
        getReport().then(setReport);
    }, []);

    if (!report?.memoQuality) {
        return <div className="p-8">Loading report</div>;
    }

    return (
        <div className="flex flex-col mx-auto p-8">
            <div className="mx-auto w-fit">
                <RadarChart
                    metrics={[
                        {
                            label: "Factual correctness",
                            value: report.memoQuality.factualCorrectness.result
                                .score,
                        },
                        {
                            label: "Reasoning linkage",
                            value: report.memoQuality.reasoningLinkage.result
                                .score,
                        },
                        {
                            label: "Recommendation calibration",
                            value: report.memoQuality.recommendation.result
                                .score,
                        },
                        {
                            label: "Trade-off handling",
                            value: report.memoQuality.tradeoffHandling.result
                                .score,
                        },
                    ]}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mx-auto mt-8">
                <Criteria
                    metric={report.memoQuality.factualCorrectness}
                    label="Factual correctness"
                />
                <Criteria
                    metric={report.memoQuality.reasoningLinkage}
                    label="Reasoning linkage"
                />
                <Criteria
                    metric={report.memoQuality.recommendation}
                    label="Recommendation calibration"
                />
                <Criteria
                    metric={report.memoQuality.tradeoffHandling}
                    label="Trade-off handling"
                />
            </div>
        </div>
    );
}
