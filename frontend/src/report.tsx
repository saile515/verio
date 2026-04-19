import { useEffect, useState } from "react";

import { Card } from "./card";
import { RadarChart } from "./radar-chart";
import { getReport } from "./server";

export type RecommendationFound =
    | "pass"
    | "invest"
    | "invest-at-revised-terms"
    | "unclear"
    | "none";

export interface ScoredCriterion {
    score: number;
    evidence: string;
}

export interface RecommendationCalibration {
    score: number;
    recommendationFound: RecommendationFound;
    evidence: string;
}

export interface MemoQuality {
    factualCorrectness: ScoredCriterion;
    reasoningLinkage: ScoredCriterion;
    tradeoffHandling: ScoredCriterion;
    recommendationCalibration: RecommendationCalibration;
}

export interface Report {
    tabTime: number[];
    pastedWords: number;
    memoQuality?: MemoQuality;
}

function Metric({ metric, label }: { metric: ScoredCriterion; label: string }) {
    return (
        <Card className="max-w-lg">
            <div className="flex items-center mb-1">
                <h2 className="text-xl">{label}</h2>
                <div className="ml-auto flex items-end">
                    <div className="size-10 text-xl flex items-center justify-center bg-blue-600 border-blue-700 border rounded-full font-bold shrink-0">
                        {Math.round(metric.score * 100) / 10}
                    </div>
                    <div className="text-zinc-400">/10</div>
                </div>
            </div>
            {metric.evidence}
        </Card>
    );
}

export function Report() {
    const [report, setReport] = useState<Report | null>(null);

    useEffect(() => {
        getReport().then(setReport);
    }, []);

    if (!report?.memoQuality) {
        return (
            <div className="bg-zinc-900 text-zinc-50 min-h-screen flex flex-col p-8">
                Loading report
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 text-zinc-50 min-h-screen flex flex-col p-8">
            <div className="mx-auto w-fit">
                <RadarChart
                    metrics={[
                        {
                            label: "Factual correctness",
                            value: report.memoQuality.factualCorrectness.score,
                        },
                        {
                            label: "Reasoning linkage",
                            value: report.memoQuality.reasoningLinkage.score,
                        },
                        {
                            label: "Recommendation calibration",
                            value: report.memoQuality.recommendationCalibration
                                .score,
                        },
                        {
                            label: "Trade-off handling",
                            value: report.memoQuality.tradeoffHandling.score,
                        },
                    ]}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mx-auto mt-8">
                <Metric
                    metric={report.memoQuality.factualCorrectness}
                    label="Factual correctness"
                />
                <Metric
                    metric={report.memoQuality.reasoningLinkage}
                    label="Reasoning linkage"
                />
                <Metric
                    metric={report.memoQuality.recommendationCalibration}
                    label="Recommendation calibration"
                />
                <Metric
                    metric={report.memoQuality.tradeoffHandling}
                    label="Trade-off handling"
                />
            </div>
        </div>
    );
}
