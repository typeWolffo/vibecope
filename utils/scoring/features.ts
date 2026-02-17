import { getCompiledPatterns } from './patterns';
import {
  CAPS_WHITELIST,
  SUPERLATIVE_WORDS,
  MONEY_REGEX,
  MONEY_CONTEXT_WORDS,
  HYPE_EMOJI_SET,
  EMOJI_REGEX,
} from './constants';
import type { FeatureKey } from './constants';

export interface FeatureResult {
  value: number;
  reason: string | null;
}

export type FeatureMap = Record<FeatureKey, FeatureResult>;

// ── Helpers

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function hasMatch(text: string, regex: RegExp | null): boolean {
  if (!regex) return false;

  regex.lastIndex = 0;

  return regex.test(text);
}

function countRegexMatches(text: string, regex: RegExp | null): number {
  if (!regex) return 0;

  regex.lastIndex = 0;

  return text.match(regex)?.length ?? 0;
}

function splitLines(text: string): string[] {
  return text.split(/\n/).filter((l) => l.trim().length > 0);
}

// ── Structural (language-agnostic)

export function extractFormatBro(text: string): FeatureResult {
  const lines = splitLines(text);

  if (lines.length < 3) return { value: 0, reason: null };

  const shortLines = lines.filter((l) => l.trim().split(/\s+/).length < 15).length;
  const ratio = shortLines / lines.length;

  // Only trigger when most lines are short (bro-post style)
  if (ratio >= 0.7) {
    const value = clamp01((ratio - 0.7) / 0.3);

    return { value, reason: `Bro-post format (${Math.round(ratio * 100)}% short lines)` };
  }

  return { value: 0, reason: null };
}

export function extractCapsIntensity(text: string): FeatureResult {
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return { value: 0, reason: null };

  const capsWords = words.filter((w) => {
    const clean = w.replace(/[^a-zA-Z]/g, '');

    return clean.length > 2 && clean === clean.toUpperCase() && !CAPS_WHITELIST.has(clean);
  });

  const ratio = capsWords.length / words.length;

  if (ratio > 0.02) {
    const value = clamp01(ratio / 0.15);

    return { value, reason: `ALL CAPS intensity ${Math.round(ratio * 100)}%` };
  }

  return { value: 0, reason: null };
}

export function extractExclamationDensity(text: string): FeatureResult {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) return { value: 0, reason: null };

  const exclCount = sentences.filter((s) => /!+\s*$/.test(s.trim())).length;
  const ratio = exclCount / sentences.length;

  if (ratio > 0.2) {
    const value = clamp01((ratio - 0.2) / 0.5);

    return { value, reason: `Exclamation density ${Math.round(ratio * 100)}%` };
  }

  return { value: 0, reason: null };
}

export function extractMonetaryClaims(text: string): FeatureResult {
  MONEY_REGEX.lastIndex = 0;
  const moneyMatches = text.match(MONEY_REGEX);

  if (!moneyMatches) return { value: 0, reason: null };

  // Check if money mention has hype context within 80 chars
  const contextHits = moneyMatches.filter((match) => {
    const idx = text.indexOf(match);
    const surrounding = text.slice(Math.max(0, idx - 80), idx + match.length + 80);

    return MONEY_CONTEXT_WORDS.test(surrounding);
  }).length;

  if (contextHits === 0) return { value: 0, reason: null };

  const value = clamp01(contextHits * 0.45);

  return { value, reason: `Monetary claim with hype context (${contextHits}x)` };
}

export function extractListicleFormat(text: string): FeatureResult {
  const hasHeader = /(?:here are|top|check out these)\s+\d+/i.test(text);
  const numberedItems = text.match(/(?:^|\n)\s*\d+[.)]\s/g);
  const hasNumbered = numberedItems !== null && numberedItems.length >= 3;
  const hasThread =
    /thread\s*🧵|🧵\s*thread/iu.test(text) || /\b(a\s+)?thread\s*[⬇↓👇]/iu.test(text);

  const score = (hasHeader ? 0.4 : 0) + (hasNumbered ? 0.4 : 0) + (hasThread ? 0.3 : 0);

  if (score === 0) return { value: 0, reason: null };

  const reasons = [
    hasHeader && 'listicle header',
    hasNumbered && `${numberedItems!.length} numbered items`,
    hasThread && 'thread format',
  ]
    .filter(Boolean)
    .join(', ');

  return { value: clamp01(score), reason: `Listicle format (${reasons})` };
}

export function extractRhetoricalHooks(text: string): FeatureResult {
  const hooks = [
    /(?:want|wanna) to (?:know|learn|see|hear)/i,
    /what if I told you/i,
    /guess what/i,
    /ready (?:for|to)/i,
    /did you know/i,
    /ever wonder/i,
    /imagine (?:if|this|a world)/i,
    /here'?s (?:the|a) (?:truth|secret|thing|reality)/i,
    /(?:nobody|no one) (?:is )?talk(?:s|ing) about/i,
    /let that sink in/i,
    /read that again/i,
  ];

  const hitCount = hooks.filter((r) => r.test(text)).length;

  if (hitCount === 0) return { value: 0, reason: null };

  const value = clamp01(hitCount * 0.35);

  return { value, reason: `Rhetorical hooks (${hitCount}x)` };
}

export function extractSuperlativeDensity(text: string): FeatureResult {
  const words = text.toLowerCase().split(/\s+/);

  if (words.length === 0) return { value: 0, reason: null };

  const hits = words.filter((w) => SUPERLATIVE_WORDS.has(w.replace(/[^a-z-]/g, ''))).length;
  const ratio = hits / words.length;

  if (ratio > 0.01) {
    const value = clamp01(ratio / 0.06);

    return { value, reason: `Superlative density ${Math.round(ratio * 100)}% (${hits}x)` };
  }

  return { value: 0, reason: null };
}

// ── Pattern-based (locale-dependent)

export function extractTimeframeClaim(text: string): FeatureResult {
  const patterns = getCompiledPatterns();
  const hasTimeFrame = hasMatch(text, patterns.timeFrameRegex);
  const hasTech = hasMatch(text, patterns.techContextRegex);

  if (hasTimeFrame && hasTech) {
    return { value: 1.0, reason: 'Timeframe claim with tech context' };
  }

  if (hasTimeFrame) {
    return { value: 0.3, reason: 'Timeframe claim (no tech context)' };
  }

  return { value: 0, reason: null };
}

export function extractBuzzwordDensity(text: string, wordCount: number): FeatureResult {
  if (wordCount === 0) return { value: 0, reason: null };

  const patterns = getCompiledPatterns();
  const matchCount = countRegexMatches(text, patterns.buzzwordRegex);
  const density = matchCount / wordCount;

  if (density > 0.01) {
    const value = clamp01(density / 0.06);

    return { value, reason: `Buzzword density ${(density * 100).toFixed(1)}% (${matchCount}x)` };
  }

  return { value: 0, reason: null };
}

export function extractSelfHypeCombo(text: string): FeatureResult {
  const patterns = getCompiledPatterns();
  const hasVerb = hasMatch(text, patterns.selfHypeVerbRegex);
  const hasMinimizer = hasMatch(text, patterns.effortMinimizerRegex);

  if (hasVerb && hasMinimizer) {
    return { value: 0.9, reason: 'Self-hype verb + effort minimizer combo' };
  }

  return { value: 0, reason: null };
}

export function extractHypeEmoji(text: string, wordCount: number): FeatureResult {
  if (wordCount === 0) return { value: 0, reason: null };

  EMOJI_REGEX.lastIndex = 0;
  const allEmoji = text.match(EMOJI_REGEX);

  if (!allEmoji) return { value: 0, reason: null };

  const hypeCount = allEmoji.filter((e) => HYPE_EMOJI_SET.has(e)).length;
  const density = hypeCount / wordCount;

  if (density > 0.02) {
    const value = clamp01(density / 0.08);

    return { value, reason: `Hype emoji density ${(density * 100).toFixed(1)}% (${hypeCount}x)` };
  }

  return { value: 0, reason: null };
}

export function extractEngagementBait(text: string): FeatureResult {
  const patterns = getCompiledPatterns();

  if (hasMatch(text, patterns.engagementBaitRegex)) {
    return { value: 0.7, reason: 'Engagement bait detected' };
  }

  return { value: 0, reason: null };
}

export function extractAiReplacement(text: string): FeatureResult {
  const patterns = getCompiledPatterns();

  if (hasMatch(text, patterns.aiReplacementRegex)) {
    return { value: 0.8, reason: 'AI replacement narrative detected' };
  }

  return { value: 0, reason: null };
}

// ── Aggregate

export function extractAllFeatures(text: string, wordCount: number): FeatureMap {
  return {
    formatBro: extractFormatBro(text),
    capsIntensity: extractCapsIntensity(text),
    exclamationDensity: extractExclamationDensity(text),
    monetaryClaims: extractMonetaryClaims(text),
    listicleFormat: extractListicleFormat(text),
    rhetoricalHooks: extractRhetoricalHooks(text),
    superlativeDensity: extractSuperlativeDensity(text),
    timeframeClaim: extractTimeframeClaim(text),
    buzzwordDensity: extractBuzzwordDensity(text, wordCount),
    selfHypeCombo: extractSelfHypeCombo(text),
    hypeEmoji: extractHypeEmoji(text, wordCount),
    engagementBait: extractEngagementBait(text),
    aiReplacement: extractAiReplacement(text),
  };
}
