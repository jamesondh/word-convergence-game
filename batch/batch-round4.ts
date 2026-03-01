#!/usr/bin/env bun

// Round 4: Stability & Symmetry
//
// Tests whether the biggest findings from rounds 1-3 are robust or lucky shots.
// For each anchor pair, runs 5 reps in both directions (A↔B and B↔A) across
// 4 models (the distinctive ones) plus cross-model matchups.
//
// Metrics computed by analysis/analyze-round4.ts:
//   1. Attractor strength — % runs landing on same convergence word/cluster
//   2. Symmetry score — how much A↔B matches B↔A
//   3. Novelty rate — % cross-model convergences not seen in solo runs
//   4. Path length variance — stability vs exploratory behavior
//
// Usage: bun run batch/batch-round4.ts

import { execSync } from "child_process";

// 4 models with distinctive personalities (drop minimax, glm-5)
const SOLO_MODELS = [
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

// Cross-model pairings: the two most interesting contrasts
const CROSS_MODEL_PAIRINGS = [
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "openai/gpt-5.2" },        // speed vs creativity
  { modelA: "x-ai/grok-4.1-fast", modelB: "google/gemini-3-flash-preview" },  // lateral vs efficient
];

// 4 anchor pairs — each tests a specific claim from rounds 1-3
const ANCHOR_PAIRS: { wordA: string; wordB: string; claim: string }[] = [
  { wordA: "Nikola Tesla", wordB: "mycelium", claim: "universal attractor: 'network'" },
  { wordA: "shadow",       wordB: "melody",   claim: "attractor: 'echo', Claude 2-round streak" },
  { wordA: "Beyonce",      wordB: "erosion",  claim: "cultural attractor: 'formation'" },
  { wordA: "Kanye West",   wordB: "lattice",  claim: "maximum divergence" },
];

const REPS = 5;

// Count total games
const soloGames = SOLO_MODELS.length * ANCHOR_PAIRS.length * 2 * REPS; // 4 × 4 × 2 × 5 = 160
const crossGames = CROSS_MODEL_PAIRINGS.length * ANCHOR_PAIRS.length * 2 * REPS; // 2 × 4 × 2 × 5 = 80
const total = soloGames + crossGames; // 240

let completed = 0;
let failures: string[] = [];

function runGame(opts: {
  model?: string;
  modelA?: string;
  modelB?: string;
  wordA: string;
  wordB: string;
  label: string;
}) {
  completed++;
  const gameLabel = `[${completed}/${total}] ${opts.label}`;
  console.log(`\n${"═".repeat(70)}`);
  console.log(gameLabel);
  console.log("═".repeat(70));

  try {
    let cmd: string;
    if (opts.modelA && opts.modelB) {
      cmd = `bun run index.ts --model-a "${opts.modelA}" --model-b "${opts.modelB}" --word-a "${opts.wordA}" --word-b "${opts.wordB}"`;
    } else {
      cmd = `bun run index.ts --model "${opts.model}" --word-a "${opts.wordA}" --word-b "${opts.wordB}"`;
    }

    const output = execSync(cmd, {
      cwd: `${import.meta.dir}/..`,
      encoding: "utf-8",
      timeout: 300_000, // 5 min per game
      env: { ...process.env, PATH: `/home/jameson/.bun/bin:${process.env.PATH}` },
    });
    console.log(output);
  } catch (err: any) {
    const msg = `FAILED: ${gameLabel}`;
    failures.push(msg);
    console.error(`\n  ❌ ${msg}`);
    console.error(`  ${err.message?.slice(0, 200)}`);
  }
}

console.log(`\n🧪 Round 4: Stability & Symmetry`);
console.log(`  ${SOLO_MODELS.length} solo models × ${ANCHOR_PAIRS.length} pairs × 2 directions × ${REPS} reps = ${soloGames} solo games`);
console.log(`  ${CROSS_MODEL_PAIRINGS.length} cross-model pairings × ${ANCHOR_PAIRS.length} pairs × 2 directions × ${REPS} reps = ${crossGames} cross-model games`);
console.log(`  Total: ${total} games\n`);

// --- Experiment A: Same-model stability ---
console.log("━".repeat(70));
console.log("  EXPERIMENT A: Same-Model Stability (5 reps × 2 directions)");
console.log("━".repeat(70));

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  📌 Testing claim: ${pair.claim}`);

  for (const model of SOLO_MODELS) {
    const shortModel = model.split("/")[1] || model;

    // Forward direction: A → B
    for (let rep = 1; rep <= REPS; rep++) {
      runGame({
        model,
        wordA: pair.wordA,
        wordB: pair.wordB,
        label: `${shortModel} — ${pair.wordA} → ${pair.wordB} (rep ${rep}/${REPS})`,
      });
    }

    // Reverse direction: B → A
    for (let rep = 1; rep <= REPS; rep++) {
      runGame({
        model,
        wordA: pair.wordB,
        wordB: pair.wordA,
        label: `${shortModel} — ${pair.wordB} → ${pair.wordA} (rep ${rep}/${REPS})`,
      });
    }
  }
}

// --- Experiment B: Cross-model stability ---
console.log("\n" + "━".repeat(70));
console.log("  EXPERIMENT B: Cross-Model Stability (5 reps × 2 directions)");
console.log("━".repeat(70));

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  📌 Testing claim: ${pair.claim}`);

  for (const { modelA, modelB } of CROSS_MODEL_PAIRINGS) {
    const shortA = modelA.split("/")[1] || modelA;
    const shortB = modelB.split("/")[1] || modelB;

    // Forward: modelA=A, modelB=B, wordA→wordB
    for (let rep = 1; rep <= REPS; rep++) {
      runGame({
        modelA,
        modelB,
        wordA: pair.wordA,
        wordB: pair.wordB,
        label: `${shortA} vs ${shortB} — ${pair.wordA} → ${pair.wordB} (rep ${rep}/${REPS})`,
      });
    }

    // Reverse word order: modelA=A, modelB=B, wordB→wordA
    for (let rep = 1; rep <= REPS; rep++) {
      runGame({
        modelA,
        modelB,
        wordA: pair.wordB,
        wordB: pair.wordA,
        label: `${shortA} vs ${shortB} — ${pair.wordB} → ${pair.wordA} (rep ${rep}/${REPS})`,
      });
    }
  }
}

// --- Summary ---
console.log(`\n${"═".repeat(70)}`);
console.log(`🏁 Round 4 complete: ${completed - failures.length}/${total} succeeded`);
if (failures.length > 0) {
  console.log(`\n❌ Failures (${failures.length}):`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log();
