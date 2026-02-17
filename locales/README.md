# Adding a new language to VibeCope

> **How scoring works:** The primary scorer is a TF-IDF classifier trained on English data. Locale pattern files power a heuristic fallback and will be used for future model retraining. Adding a locale still helps — it feeds the heuristic layer and builds the dataset for the next model iteration.

## Steps

1. Fork the repository
2. Copy `locales/en.json` as `locales/{language-code}.json`
3. Set `"locale"` (e.g. `"de"`) and `"label"` (e.g. `"Deutsch"`) in your file
4. Translate / adapt the phrase arrays for your language:
   - **timeFramePhrases** — may contain regex (`\\d+` for numbers, e.g. `"built in \\d+ hours?"`)
   - **techContext** — tech keywords in your language
   - **buzzwords** — local equivalents of hype buzzwords
   - **selfHypeVerbs** — "I built", "I launched", etc. in your language
   - **effortMinimizers** — "no code", "just prompts", etc. in your language
   - **aiReplacementClaims** — "AI will replace…" patterns in your language
   - **engagementBait** — "save this", "here are N …" patterns in your language
   - **bioSignals** — usually the same across languages (CEO / Founder are universal)
5. Register the locale in `utils/scoring/patterns.ts`:
   - Add an import: `import xxLocale from '../../locales/xx.json';`
   - Append it to the `ALL_LOCALES` array
6. Open a PR describing which language you're adding
