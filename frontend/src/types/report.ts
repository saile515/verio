export interface CriteriaResult {
    score: number;
    evidence: string;
}

export interface Criteria {
    result: CriteriaResult;
}

export type RecommendationFound =
    | "pass"
    | "invest"
    | "invest-at-revised-terms"
    | "unclear"
    | "none";

export interface RecommendationCriteria extends Criteria {
    recommendationFound: RecommendationFound;
}

export interface MemoQuality {
    factualCorrectness: Criteria;
    reasoningLinkage: Criteria;
    tradeoffHandling: Criteria;
    recommendation: RecommendationCriteria;
}

export interface Propagation {
    status: "fired" | "not-fired";
    result:
        | "propagated"
        | "clean"
        | "corrected-in-memo"
        | "ambiguous"
        | "not-applicable";
    evidenceQuote?: string;
    positiveChallengeFlag: boolean;
    notes?: string;
}

export interface MemoGrade {
    propagation: Propagation[];
    quality: MemoQuality;
    flags: string[];
}

export interface InjectionBehavior {
    index: number;
    status: "triggered" | "not-triggered";
    outcome: string;
    outcomeScore: number | null;
    challengeStrength: "none" | "weak" | "valid" | null;
    confidence: "high" | "medium" | "low";
}

export interface BehaviorGrade {
    injections: InjectionBehavior[];
    pasteDependence: {
        score: number | null;
        ambiguousPasteCount: number;
    };
    timeBeforeFirstAi: {
        score: number | null;
        elapsedSeconds: number | null;
    };
    promptQuality: {
        trimmedMean: number | null;
        maxLevelAchieved: number | null;
        promptCount: number;
    };
    flags: string[];
}

export interface VerdictDimension {
    score: number;
    band: "low" | "developing" | "strong" | "exceptional";
    evidenceBullets: string[];
}

export interface Verdict {
    verdict: "strong-hire" | "hire" | "lean-no-hire" | "no-hire";
    verdictRationale: string;
    confidenceScore: number;
    recoveryFloorTriggered: boolean;
    patternLabel: string;
    dimensions: {
        evidenceDiscipline: VerdictDimension;
        aiGovernance: VerdictDimension;
        recoveryUnderError: VerdictDimension & {
            injectionsTriggered: number;
            injectionsChallengedValid: number;
            injectionsPropagated: number;
        };
        analyticalJudgment: VerdictDimension;
    };
    keyObservations: string[];
    contradictions: string[];
    flags: string[];
}

export interface Report {
    tabTime: number[];
    pastedWords: number;
    memo?: MemoGrade;
    behavior?: BehaviorGrade;
    verdict?: Verdict;
}
