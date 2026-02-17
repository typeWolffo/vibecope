import vocabulary from './ml/vocabulary.json';
import weights from './ml/weights.json';

// Build token -> index lookup once at module load
const tokenIndex = new Map<string, number>(
  vocabulary.features.map((feature, i) => [feature, i] as const),
);

function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const bigrams = words.slice(0, -1).map((w, i) => w + ' ' + words[i + 1]);
  const trigrams = words.slice(0, -2).map((w, i) => w + ' ' + words[i + 1] + ' ' + words[i + 2]);

  return [...words, ...bigrams, ...trigrams];
}

export function classifyPost(text: string): number {
  const tokens = tokenize(text);

  const termFrequencies = new Map<string, number>();

  for (const t of tokens) {
    termFrequencies.set(t, (termFrequencies.get(t) ?? 0) + 1);
  }

  // TF-IDF -> dot product with linear regression coefficients
  const dot = Array.from(termFrequencies.entries()).reduce((sum, [token, count]) => {
    const idx = tokenIndex.get(token);

    if (idx === undefined) return sum;

    const tfidf = (count / tokens.length) * vocabulary.idf[idx];

    return sum + tfidf * weights.coefficients[idx];
  }, weights.intercept);

  // Sigmoid -> 0-100
  return Math.round((1 / (1 + Math.exp(-dot))) * 100);
}

export function isModelLoaded(): boolean {
  return tokenIndex.size > 0;
}
