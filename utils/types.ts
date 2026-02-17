export type Platform = 'linkedin' | 'x';

export type FilterAction = 'blur' | 'collapse' | 'badge';

export type EnabledPlatforms = Record<Platform, boolean>;

export interface ScoringResult {
  score: number;
  reasons: string[];
}

export interface LocaleData {
  locale: string;
  label: string;
  timeFramePhrases: string[];
  techContext: string[];
  buzzwords: string[];
  selfHypeVerbs: string[];
  effortMinimizers: string[];
  bioSignals: string[];
  aiReplacementClaims: string[];
  engagementBait: string[];
}
