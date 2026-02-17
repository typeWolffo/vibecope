import enLocale from '../../locales/en.json';
import plLocale from '../../locales/pl.json';
import { enabledLocales } from '../storage';
import type { LocaleData } from '../types';

const ALL_LOCALES: LocaleData[] = [enLocale, plLocale];

export interface CompiledPatterns {
  timeFrameRegex: RegExp | null;
  techContextRegex: RegExp | null;
  buzzwordRegex: RegExp | null;
  selfHypeVerbRegex: RegExp | null;
  effortMinimizerRegex: RegExp | null;
  aiReplacementRegex: RegExp | null;
  engagementBaitRegex: RegExp | null;
  /** Flat arrays for counting individual matches */
  buzzwordPatterns: RegExp[];
  selfHypeVerbPatterns: RegExp[];
  effortMinimizerPatterns: RegExp[];
}

const cache = { patterns: null as CompiledPatterns | null };

function mergeField(
  locales: LocaleData[],
  field: keyof Omit<LocaleData, 'locale' | 'label'>,
): string[] {
  const merged = new Set<string>();

  for (const locale of locales) {
    for (const phrase of locale[field]) {
      merged.add(phrase);
    }
  }

  return [...merged];
}

function buildCombinedRegex(phrases: string[]): RegExp | null {
  if (phrases.length === 0) return null;

  const pattern = phrases.map((p) => `(?:${p})`).join('|');

  return new RegExp(pattern, 'gi');
}

function buildIndividualRegexes(phrases: string[]): RegExp[] {
  return phrases.map((p) => new RegExp(p, 'gi'));
}

function compilePatterns(activeLocaleIds: string[]): CompiledPatterns {
  const active = ALL_LOCALES.filter((l) => activeLocaleIds.includes(l.locale));

  const timeFramePhrases = mergeField(active, 'timeFramePhrases');
  const techContext = mergeField(active, 'techContext');
  const buzzwords = mergeField(active, 'buzzwords');
  const selfHypeVerbs = mergeField(active, 'selfHypeVerbs');
  const effortMinimizers = mergeField(active, 'effortMinimizers');
  const aiReplacementClaims = mergeField(active, 'aiReplacementClaims');
  const engagementBait = mergeField(active, 'engagementBait');

  return {
    timeFrameRegex: buildCombinedRegex(timeFramePhrases),
    techContextRegex: buildCombinedRegex(techContext),
    buzzwordRegex: buildCombinedRegex(buzzwords),
    selfHypeVerbRegex: buildCombinedRegex(selfHypeVerbs),
    effortMinimizerRegex: buildCombinedRegex(effortMinimizers),
    aiReplacementRegex: buildCombinedRegex(aiReplacementClaims),
    engagementBaitRegex: buildCombinedRegex(engagementBait),
    buzzwordPatterns: buildIndividualRegexes(buzzwords),
    selfHypeVerbPatterns: buildIndividualRegexes(selfHypeVerbs),
    effortMinimizerPatterns: buildIndividualRegexes(effortMinimizers),
  };
}

export async function initPatterns(): Promise<CompiledPatterns> {
  const localeIds = await enabledLocales.getValue();

  cache.patterns = compilePatterns(localeIds);

  return cache.patterns;
}

export function getCompiledPatterns(): CompiledPatterns {
  if (!cache.patterns) {
    // Fallback: compile with all locales synchronously
    cache.patterns = compilePatterns(['en', 'pl']);
  }

  return cache.patterns;
}

export function watchLocaleChanges(): void {
  enabledLocales.watch((newLocales) => {
    cache.patterns = compilePatterns(newLocales);
  });
}

export function getAvailableLocales(): Array<{ locale: string; label: string }> {
  return ALL_LOCALES.map((l) => ({ locale: l.locale, label: l.label }));
}
