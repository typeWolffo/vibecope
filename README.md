# 🐃
A fun side project to see how far TF-IDF and some regex can go in detecting hustle-culture hype on social media. It's a browser extension that scores posts on X and LinkedIn and quietly filters the "I replaced my entire engineering team with one prompt" crowd.

### How it works

Each post runs through a TF-IDF classifier (unigrams + bigrams + trigrams -> logistic regression) trained on ~350 labeled posts. If the model can't load for some reason, a regex heuristic engine takes over as fallback.

Both layers look for the same signals:

- Timeframe brags
- Buzzword density
- Self-hype combos
- Effort minimizers
- AI replacement narratives
- Engagement bait
- Structural signals

Posts get a score from 0 to 100. Cross the threshold and they get filtered.

### Filter modes

- Collapse (default) - Post hidden behind a one-line bar
- Blur - Post blurred with an overlay
- Badge - Score badge in the corner

You can also adjust the sensitivity, toggle platforms, and set custom CSS selectors for when X or LinkedIn inevitably change their DOM.

### Development

```bash
bun install
bun run dev          # Chrome, hot reload
bun run dev:firefox  # Firefox
bun run build        # production build
bun run zip          # package for store submission
```

Also: `bun run lint`, `bun run format`, `bun run compile`.
