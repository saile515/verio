import { useEffect, useState } from "react";

import { Card } from "../components/card";
import { RadarChart } from "../components/radar-chart";
import { getReport } from "../lib/server";
import type { Criteria, Report } from "../types/report";

function formatScore(score: number | null) {
    return score == null ? "N/A" : (Math.round(score * 100) / 100).toString();
}

function Criteria({ metric, label }: { metric: Criteria; label: string }) {
    return (
        <Card className="max-w-lg">
            <div className="flex items-center mb-2">
                <h2 className="text-xl">{label}</h2>
                <div
                    className="ml-auto size-12 p-1 rounded-full shrink-0 -mt-4"
                    style={{
                        background: `conic-gradient(var(--color-lime-200) ${metric.result.score * 100}%, var(--color-stone-900) ${metric.result.score * 100}%)`,
                    }}>
                    <div className="size-full bg-stone-800 rounded-full flex items-center justify-center font-bold text-lg">
                        {Math.round(metric.result.score * 100) / 10}
                    </div>
                </div>
            </div>
            {metric.result.evidence}
        </Card>
    );
}

function VerdictSummary({ report }: { report: Report }) {
    if (!report.verdict) {
        return null;
    }

    const { verdict } = report;

    return (
        <Card className="max-w-lg">
            <h2 className="text-xl mb-2">Verdict</h2>
            <div className="text-lime-200 font-bold text-2xl mb-2">
                {verdict.verdict}
            </div>
            <p className="mb-4">{verdict.verdictRationale}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <div className="text-stone-400">Confidence</div>
                    <div>{formatScore(verdict.confidenceScore)}</div>
                </div>
                <div>
                    <div className="text-stone-400">Pattern</div>
                    <div>{verdict.patternLabel}</div>
                </div>
                <div>
                    <div className="text-stone-400">Recovery</div>
                    <div>
                        {formatScore(
                            verdict.dimensions.recoveryUnderError.score,
                        )}{" "}
                        ({verdict.dimensions.recoveryUnderError.band})
                    </div>
                </div>
                <div>
                    <div className="text-stone-400">Analytical judgment</div>
                    <div>
                        {formatScore(
                            verdict.dimensions.analyticalJudgment.score,
                        )}{" "}
                        ({verdict.dimensions.analyticalJudgment.band})
                    </div>
                </div>
            </div>
        </Card>
    );
}

function BehaviorSummary({ report }: { report: Report }) {
    if (!report.behavior) {
        return null;
    }

    const { behavior } = report;
    const triggeredInjections = behavior.injections.filter(
        (injection) => injection.status == "triggered",
    );

    return (
        <Card className="max-w-lg">
            <h2 className="text-xl mb-2">Behavior</h2>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                    <div className="text-stone-400">Prompt quality</div>
                    <div>{formatScore(behavior.promptQuality.trimmedMean)}</div>
                </div>
                <div>
                    <div className="text-stone-400">Max prompt level</div>
                    <div>
                        {behavior.promptQuality.maxLevelAchieved ?? "N/A"}
                    </div>
                </div>
                <div>
                    <div className="text-stone-400">Time before first AI</div>
                    <div>
                        {behavior.timeBeforeFirstAi.elapsedSeconds == null
                            ? "N/A"
                            : `${Math.round(
                                  behavior.timeBeforeFirstAi.elapsedSeconds,
                              )}s`}
                    </div>
                </div>
                <div>
                    <div className="text-stone-400">Ambiguous pastes</div>
                    <div>{behavior.pasteDependence.ambiguousPasteCount}</div>
                </div>
            </div>
            <div className="text-stone-400 text-sm mb-1">
                Triggered injections
            </div>
            <div className="flex flex-col gap-1 text-sm">
                {triggeredInjections.length == 0
                    ? "None"
                    : triggeredInjections.map((injection) => (
                          <div key={injection.index}>
                              Injection {injection.index}: {injection.outcome} (
                              {formatScore(injection.outcomeScore)})
                          </div>
                      ))}
            </div>
        </Card>
    );
}

export function Report() {
    const [report, setReport] = useState<Report | null>(null);

    console.log(report);

    useEffect(() => {
        getReport().then(setReport);
    }, []);

    if (!report?.memo?.quality) {
        return <div className="p-8">Loading report</div>;
    }

    return (
        <div className="flex flex-col mx-auto p-8">
            <div className="mx-auto w-fit">
                <RadarChart
                    metrics={[
                        {
                            label: "Factual correctness",
                            value: report.memo.quality.factualCorrectness.result
                                .score,
                        },
                        {
                            label: "Reasoning linkage",
                            value: report.memo.quality.reasoningLinkage.result
                                .score,
                        },
                        {
                            label: "Recommendation calibration",
                            value: report.memo.quality.recommendation.result
                                .score,
                        },
                        {
                            label: "Trade-off handling",
                            value: report.memo.quality.tradeoffHandling.result
                                .score,
                        },
                    ]}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mx-auto mt-8">
                <Criteria
                    metric={report.memo.quality.factualCorrectness}
                    label="Factual correctness"
                />
                <Criteria
                    metric={report.memo.quality.reasoningLinkage}
                    label="Reasoning linkage"
                />
                <Criteria
                    metric={report.memo.quality.recommendation}
                    label="Recommendation calibration"
                />
                <Criteria
                    metric={report.memo.quality.tradeoffHandling}
                    label="Trade-off handling"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mx-auto mt-4">
                <VerdictSummary report={report} />
                <BehaviorSummary report={report} />
            </div>
        </div>
    );
}
