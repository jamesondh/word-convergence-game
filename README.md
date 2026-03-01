# word-convergence-game

Two LLMs play **Convergence** — the party game where two players shout random words, then try to meet in the middle.

Each round, both models independently pick a word that bridges the previous two. The game ends when they say the same word (or hit the max round limit).

## Setup

```bash
bun install
cp .env.example .env  # add your OpenRouter API key
```

## Usage

```bash
bun run index.ts                                          # default: minimax-m2.5, 20 rounds
bun run index.ts --model google/gemini-2.0-flash-001      # try a different model
bun run index.ts --max-rounds 30                          # more patience
```

## Example output

```
🎮 Starting Convergence Game
   Model: minimax/minimax-m2.5
   Max rounds: 20
────────────────────────────────────────────

  Round  1:  susurrus  ↔  kaleidoscope
  Round  2:  wave  ↔  symphony
  Round  3:  sound  ↔  sound  ✅

────────────────────────────────────────────
📊 Game Summary
────────────────────────────────────────────

  ✅ Converged on "sound" in 3 rounds

  Path:
     1. susurrus  ↔  kaleidoscope
     2. wave  ↔  symphony
     3. sound  ↔  sound ✅

  Unique words: 5
  All words: susurrus, kaleidoscope, wave, symphony, sound
```

## How it works

- Both LLMs get **separate contexts** — neither sees the other's reasoning, only the shared word history
- Each round is stateless: full game history is passed as a single prompt (no conversation threading)
- Basic plural normalization prevents near-misses like "root" vs "roots"
- Uses OpenRouter, so any model works — try reasoning models vs instruct models and see how the convergence paths differ
