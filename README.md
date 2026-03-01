# word-convergence-game

Two LLMs play **Convergence** — the party game where two players try to say the same word by bridging their previous words each round.

Starting words are drawn from a [curated dictionary](./words.ts) of ~400 common nouns, so the experiment tests **interpolation ability**, not word selection.

## Setup

```bash
bun install
cp .env.example .env  # add your OpenRouter API key
```

## Usage

```bash
# basic — random dictionary words, default model (minimax-m2.5)
bun run index.ts

# specify a model
bun run index.ts --model google/gemini-2.0-flash-001

# pit two models against each other
bun run index.ts --model-a openai/gpt-4o --model-b anthropic/claude-3.5-sonnet

# control starting words
bun run index.ts --word-a mountain --word-b ocean

# all options
bun run index.ts --model moonshotai/kimi-k2.5 --word-a shadow --word-b melody --max-rounds 30
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--model <id>` | OpenRouter model for both players | `minimax/minimax-m2.5` |
| `--model-a <id>` | Model for Player A (overrides `--model`) | — |
| `--model-b <id>` | Model for Player B (overrides `--model`) | — |
| `--word-a <word>` | Starting word for Player A | random from dictionary |
| `--word-b <word>` | Starting word for Player B | random from dictionary |
| `--max-rounds <n>` | Max rounds before giving up | `20` |

## Results

Every game automatically saves a JSON file to `results/`, including full metadata:

```json
{
  "timestamp": "2026-03-01T17:30:00.000Z",
  "config": {
    "modelA": "minimax/minimax-m2.5",
    "modelB": "minimax/minimax-m2.5",
    "maxRounds": 20,
    "startingWords": ["mountain", "ocean"]
  },
  "rounds": [
    { "number": 1, "wordA": "mountain", "wordB": "ocean", "converged": false },
    { "number": 2, "wordA": "glacier", "wordB": "depth", "converged": false },
    { "number": 3, "wordA": "ice", "wordB": "ice", "converged": true }
  ],
  "converged": true,
  "totalRounds": 3,
  "convergedWord": "ice",
  "uniqueWords": ["mountain", "ocean", "glacier", "depth", "ice"]
}
```

This makes it easy to compare convergence behavior across models, analyze paths, and generate article data.

## Example output

```
🎮 Starting Convergence Game
   Model: minimax/minimax-m2.5
   Starting words: canyon ↔ lighthouse
   Max rounds: 20
──────────────────────────────────────────────────

  Round  1:  canyon  ↔  lighthouse
  Round  2:  cliff  ↔  beacon
  Round  3:  edge  ↔  signal
  Round  4:  light  ↔  light  ✅

──────────────────────────────────────────────────
📊 Game Summary
──────────────────────────────────────────────────

  ✅ Converged on "light" in 4 rounds

  Path:
     1. canyon  ↔  lighthouse
     2. cliff  ↔  beacon
     3. edge  ↔  signal
     4. light  ↔  light ✅

  Unique words: 7
  All words: canyon, lighthouse, cliff, beacon, edge, signal, light

  💾 Saved to results/2026-03-01T17-30-00-minimax_minimax-m2.5-canyon-lighthouse.json
```

## How it works

- Starting words come from a **built-in dictionary** of ~400 nouns — removes model word-selection bias as a variable
- Both LLMs get **separate contexts** — neither sees the other's reasoning, only the shared word history
- Each round is stateless: full game history is passed as a single prompt (no conversation threading)
- Basic plural normalization prevents near-misses like "root" vs "roots"
- Supports **same-model** (test one model's interpolation) or **cross-model** (pit models against each other)
- All results saved as structured JSON for analysis
