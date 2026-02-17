export const PATTERN_WEIGHTS = {
  timeframeClaim: 0.2,
  buzzwordDensity: 0.15,
  selfHypeCombo: 0.15,
  monetaryClaims: 0.18,
  engagementBait: 0.12,
  aiReplacement: 0.2,
} as const;

export const STRUCTURAL_WEIGHTS = {
  formatBro: 0.15,
  capsIntensity: 0.1,
  exclamationDensity: 0.1,
  listicleFormat: 0.2,
  rhetoricalHooks: 0.15,
  superlativeDensity: 0.15,
  hypeEmoji: 0.15,
} as const;

/** Structural boost max — might give up to 50% bonus points if post is structurally very hype */
export const STRUCTURAL_MAX_BOOST = 0.5;

/** Structural floor — max punkty gdy same structural bez patternów */
export const STRUCTURAL_FLOOR = 5;

/** Min pattern score żeby structural boost zadziałał (zapobiega FP na słabych matchach) */
export const MIN_PATTERN_SCORE_FOR_BOOST = 8;

export type PatternKey = keyof typeof PATTERN_WEIGHTS;
export type StructuralKey = keyof typeof STRUCTURAL_WEIGHTS;
export type FeatureKey = PatternKey | StructuralKey;

/** ALL CAPS whitelist — te skróty nie liczą się jako caps spam */
export const CAPS_WHITELIST = new Set([
  'I',
  'AI',
  'API',
  'SaaS',
  'CEO',
  'CTO',
  'CFO',
  'COO',
  'VP',
  'AWS',
  'GCP',
  'SQL',
  'CSS',
  'HTML',
  'JSON',
  'XML',
  'HTTP',
  'HTTPS',
  'URL',
  'UI',
  'UX',
  'MVP',
  'KPI',
  'ROI',
  'B2B',
  'B2C',
  'USA',
  'UK',
  'CRUD',
  'REST',
  'SDK',
  'CLI',
  'IDE',
  'GPU',
  'CPU',
  'RAM',
  'SSD',
  'SEO',
  'CRM',
  'ERP',
  'IoT',
  'NLP',
  'ML',
  'LLM',
  'GPT',
  'VPN',
  'OK',
  'ASAP',
  'FAQ',
  'FYI',
  'TL',
  'DR',
  'TLDR',
  'PM',
  'AM',
  'BREAKING',
  'UPDATE',
  'NEW',
  'FREE',
]);

/** Superlative / absolutne słowa do density check */
export const SUPERLATIVE_WORDS = new Set([
  'best',
  'worst',
  'never',
  'always',
  'everyone',
  'nobody',
  'insane',
  'incredible',
  'unbelievable',
  'impossible',
  'mind-blowing',
  'jaw-dropping',
  'life-changing',
  'guaranteed',
  'effortless',
  'instantly',
  'forever',
]);

/** Regex dla kwot pieniężnych */
export const MONEY_REGEX =
  /\$[\d,.]+[kKmM]?|\d+\s*(?:dollars?|thousand|million|k\/(?:mo|yr|year|month))/gi;

/** Słowa kontekstowe obok kwot — bez nich kwota nie liczy się jako hype */
export const MONEY_CONTEXT_WORDS =
  /(?:sav(?:e|ing|ed)|replac(?:e|ing|ed)|earn(?:ing|ed)?|free|mak(?:e|ing)|generat(?:e|ing)|worth|cost|revenue|income|profit|salary|per\s+(?:month|year|day))/i;

/** Emoji hype set — tylko te emoji liczą się do density */
export const HYPE_EMOJI_SET = new Set(['🚀', '🔥', '💯', '🎯', '💰', '🏆', '⚡', '💪', '🙌', '✨']);

/** Regex do wyciągania wszystkich emoji z tekstu */
export const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

/** Domyślny threshold */
export const DEFAULT_THRESHOLD = 50;
