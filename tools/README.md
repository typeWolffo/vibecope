# Tools

Scripts for training the VibeCope ML classifier.

## How it works

The classifier is a TF-IDF (unigrams + bigrams + trigrams) fed into Logistic Regression. The training script reads labeled posts from JSONL files, builds the vocabulary, trains the model, and exports JSON weights that the browser extension loads at runtime.

## Dataset

`dataset/hustle.jsonl` — positive examples (hustle-hype posts)
`dataset/normal.jsonl` — negative examples (normal posts)

Each line is a JSON object with a `"text"` field:

```json
{"text": "I built a SaaS in 2 hours using only AI prompts!"}
```

### Contributing examples

Add new lines to the appropriate JSONL file. Good positive examples exhibit several hustle-hype signals (timeframe brags, effort minimizing, buzzwords). Good negative examples are regular tech posts, news, opinions, or discussions.

## Retraining

```bash
cd tools
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_classifier.py
```

Output goes to `utils/scoring/ml/`:
- `vocabulary.json` — TF-IDF feature names + IDF weights
- `weights.json` — Logistic Regression coefficients + intercept

After retraining, rebuild the extension with `bun run build`.
