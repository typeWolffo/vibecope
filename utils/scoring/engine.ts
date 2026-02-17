import type { ScoringResult } from '../types';
import { extractAllFeatures } from './features';
import { classifyPost, isModelLoaded } from './classifier';
import {
  PATTERN_WEIGHTS,
  STRUCTURAL_WEIGHTS,
  STRUCTURAL_MAX_BOOST,
  STRUCTURAL_FLOOR,
  MIN_PATTERN_SCORE_FOR_BOOST,
} from './constants';
import type { PatternKey, StructuralKey } from './constants';

function countWords(text: string): number {
  const words = text.trim().split(/\s+/);

  return words.length > 0 && words[0] !== '' ? words.length : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scorePostHeuristic(text: string): ScoringResult {
  const wordCount = countWords(text);
  const features = extractAllFeatures(text, wordCount);

  const patternKeys = Object.keys(PATTERN_WEIGHTS) as PatternKey[];
  const structuralKeys = Object.keys(STRUCTURAL_WEIGHTS) as StructuralKey[];

  const patternScore = patternKeys.reduce(
    (sum, key) => sum + features[key].value * PATTERN_WEIGHTS[key] * 100,
    0,
  );

  const structuralSum = structuralKeys.reduce(
    (sum, key) => sum + features[key].value * STRUCTURAL_WEIGHTS[key],
    0,
  );

  const reasons = [
    ...patternKeys.map((key) => features[key].reason).filter((r): r is string => r !== null),
    ...structuralKeys.map((key) => features[key].reason).filter((r): r is string => r !== null),
  ];

  const rawScore =
    patternScore >= MIN_PATTERN_SCORE_FOR_BOOST
      ? patternScore * (1 + structuralSum * STRUCTURAL_MAX_BOOST)
      : patternScore > 0
        ? patternScore
        : structuralSum * STRUCTURAL_FLOOR;

  return {
    score: clamp(Math.round(rawScore), 0, 100),
    reasons,
  };
}

export function scorePost(text: string): ScoringResult {
  if (isModelLoaded()) {
    const mlScore = classifyPost(text);

    return {
      score: clamp(Math.round(mlScore), 0, 100),
      reasons: [`ML confidence: ${mlScore}%`],
    };
  }

  return scorePostHeuristic(text);
}
