#!/usr/bin/env python3
"""
Train a TF-IDF + Logistic Regression classifier for hustle-hype detection.

Usage:
    pip install -r tools/requirements.txt
    python tools/train_classifier.py

Input:
    tools/dataset/hustle.jsonl   — positive examples (hustle hype)
    tools/dataset/normal.jsonl   — negative examples (normal posts)

Output:
    utils/scoring/ml/vocabulary.json  — TF-IDF vocabulary + IDF weights
    utils/scoring/ml/weights.json     — LR coefficients + intercept
"""

import json
import os
import sys
from pathlib import Path

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score
    import numpy as np
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install -r tools/requirements.txt")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
DATASET_DIR = ROOT / "tools" / "dataset"
OUTPUT_DIR = ROOT / "utils" / "scoring" / "ml"

def load_jsonl(path: Path) -> list[str]:
    texts = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                texts.append(json.loads(line)["text"])
    return texts

def log(msg: str) -> None:
    print(f"[train] {msg}", flush=True)

def main():
    log("VibeCope ML classifier trainer")
    log(f"Dataset dir: {DATASET_DIR}")
    log(f"Output dir:  {OUTPUT_DIR}")

    hustle_path = DATASET_DIR / "hustle.jsonl"
    normal_path = DATASET_DIR / "normal.jsonl"

    if not hustle_path.exists() or not normal_path.exists():
        log(f"ERROR: Dataset files not found in {DATASET_DIR}")
        sys.exit(1)

    log("Loading dataset...")
    hustle = load_jsonl(hustle_path)
    normal = load_jsonl(normal_path)
    log(f"  hustle: {len(hustle)} examples")
    log(f"  normal: {len(normal)} examples")
    log(f"  total:  {len(hustle) + len(normal)} examples")

    if len(hustle) < 10 or len(normal) < 10:
        log("WARNING: Very small dataset. Model quality will be poor.")
        log("  Add more examples to tools/dataset/ for better results.")

    texts = hustle + normal
    labels = np.array([1] * len(hustle) + [0] * len(normal))

    log("Building TF-IDF vocabulary (unigrams + bigrams + trigrams, max 5000 features)...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=5000,
        lowercase=True,
        strip_accents="unicode",
        min_df=1,
        max_df=0.95,
    )
    X = vectorizer.fit_transform(texts)
    log(f"  vocabulary size: {len(vectorizer.vocabulary_)} features")
    log(f"  matrix shape:    {X.shape[0]} docs x {X.shape[1]} features")

    log("Training Logistic Regression...")
    clf = LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs")
    clf.fit(X, labels)
    log("  training complete")

    # Cross-validation (if enough data)
    if len(texts) >= 20:
        n_folds = min(5, min(len(hustle), len(normal)))
        if n_folds >= 2:
            log(f"Running {n_folds}-fold cross-validation...")
            scores = cross_val_score(clf, X, labels, cv=n_folds, scoring="accuracy")
            log(f"  CV accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")

    train_acc = clf.score(X, labels)
    log(f"  training accuracy: {train_acc:.3f}")

    log("Exporting model...")
    feature_names = vectorizer.get_feature_names_out().tolist()
    idf_weights = vectorizer.idf_.tolist()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    vocab_path = OUTPUT_DIR / "vocabulary.json"
    with open(vocab_path, "w") as f:
        json.dump({"features": feature_names, "idf": idf_weights}, f)
    vocab_size_kb = os.path.getsize(vocab_path) / 1024
    log(f"  vocabulary: {vocab_path.relative_to(ROOT)} ({vocab_size_kb:.1f} KB)")

    weights_path = OUTPUT_DIR / "weights.json"
    with open(weights_path, "w") as f:
        json.dump(
            {
                "coefficients": clf.coef_[0].tolist(),
                "intercept": float(clf.intercept_[0]),
            },
            f,
        )
    weights_size_kb = os.path.getsize(weights_path) / 1024
    log(f"  weights:    {weights_path.relative_to(ROOT)} ({weights_size_kb:.1f} KB)")
    log(f"  total size: {vocab_size_kb + weights_size_kb:.1f} KB")

    # Show top features
    coef = clf.coef_[0]
    top_hustle_idx = np.argsort(coef)[-15:][::-1]
    top_normal_idx = np.argsort(coef)[:15]

    print()
    log("Top 15 hustle indicators:")
    for idx in top_hustle_idx:
        print(f"  {feature_names[idx]:30s}  {coef[idx]:+.4f}")

    print()
    log("Top 15 normal indicators:")
    for idx in top_normal_idx:
        print(f"  {feature_names[idx]:30s}  {coef[idx]:+.4f}")

    print()
    log("Done. Run 'bun run build' to bundle the model into the extension.")

if __name__ == "__main__":
    main()
