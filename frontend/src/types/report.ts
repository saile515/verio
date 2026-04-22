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

export interface Report {
    tabTime: number[];
    pastedWords: number;
    memoQuality?: MemoQuality;
}
