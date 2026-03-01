#!/usr/bin/env bun

// Round 5: Temperature, Prediction & Direction
//
// Three experiments testing the biggest open questions from rounds 1-4:
//
// A) Temperature comparison (96 games)
//    Same 4 anchor pairs at temp=0.3 — are basins real structure or high-temp noise?
//    4 pairs × 4 models × 2 directions × 3 reps = 96
//
// B) Prediction test (72 games)
//    3 new pairs with predicted basin depths:
//    - "Einstein↔ocean" → predicted DEEP basin ("wave" or "energy")
//    - "Shakespeare↔algorithm" → predicted MODERATE (multiple frames: writing, pattern, iambic)
//    - "Beyonce↔mycelium" → predicted FLAT (no obvious intersection)
//    4 models × 3 reps × 2 directions = 72
//
// C) Cross-model direction test (72 games)
//    Does Player A vs Player B assignment matter in cross-model games?
//    Claude-A/GPT-B vs GPT-A/Claude-B on 4 anchor pairs
//    4 pairs × 2 orderings × 3 reps × 3 pairings (Claude↔GPT, Grok↔Gemini, Claude↔Grok) = 72
//
// Total: 240 games
//
// Usage: bun run batch/batch-round5.ts

import { execSync } from "child_process";

const SOLO_MODELS = [
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

// --- Experiment A: Temperature comparison ---
const ANCHOR_PAIRS: { wordA: string; wordB: string; label: string }[] = [
  { wordA: "Nikola Tesla", wordB: "mycelium", label: "Tesla↔mycelium" },
  { wordA: "shadow",       wordB: "melody",   label: "shadow↔melody" },
  { wordA: "Beyonce",      wordB: "erosion",  label: "Beyoncé↔erosion" },
  { wordA: "Kanye West",   wordB: "lattice",  label: "Kanye↔lattice" },
];

const LOW_TEMP = 0.3;
const REPS_A = 3;

// --- Experiment B: Prediction test ---
const PREDICTION_PAIRS: { wordA: string; wordB: string; prediction: string; label: string }[] = [
  { wordA: "Einstein",     wordB: "ocean",     prediction: "DEEP (wave/energy)", label: "Einstein↔ocean" },
  { wordA: "Shakespeare",  wordB: "algorithm", prediction: "MODERATE (pattern/verse/structure)", label: "Shakespeare↔algorithm" },
  { wordA: "Beyonce",      wordB: "mycelium",  prediction: "FLAT (no obvious bridge)", label: "Beyoncé↔mycelium" },
];

const REPS_B = 3;

// --- Experiment C: Cross-model direction test ---
const CROSS_MODEL_ORDERINGS = [
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "openai/gpt-5.2", label: "Claude→GPT" },
  { modelA: "openai/gpt-5.2", modelB: "anthropic/claude-sonnet-4.6", label: "GPT→Claude" },
  { modelA: "x-ai/grok-4.1-fast", modelB: "google/gemini-3-flash-preview", label: "Grok→Gemini" },
  { modelA: "google/gemini-3-flash-preview", modelB: "x-ai/grok-4.1-fast", label: "Gemini→Grok" },
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "x-ai/grok-4.1-fast", label: "Claude→Grok" },
  { modelA: "x-ai/grok-4.1-fast", modelB: "anthropic/claude-sonnet-4.6", label: "Grok→Claude" },
];

const REPS_C = 3;

// Count total games
const totalA = SOLO_MODELS.length * ANCHOR_PAIRS.length * 2 * REPS_A; // 4×4×2×3 = 96
const totalB = SOLO_MODELS.length * PREDICTION_PAIRS.length * 2 * REPS_B; // 4×3×2×3 = 72
const totalC = CROSS_MODEL_ORDERINGS.length * ANCHOR_PAIRS.length * REPS_C; // 6×4×3 = 72
const total = totalA + totalB + totalC; // 240

let completed = 0;
let failures: string[] = [];

function runGame(opts: {
  model?: string;
  modelA?: string;
  modelB?: string;
  wordA: string;
  wordB: string;
  temperature?: number;
  label: string;
}) {
  completed++;
  const gameLabel = `[${completed}/${total}] ${opts.label}`;
  console.log(`\n${"═".repeat(70)}`);
  console.log(gameLabel);
  console.log("═".repeat(70));

  const tempFlag = opts.temperature !== undefined ? ` --temperature ${opts.temperature}` : "";

  try {
    let cmd: string;
    if (opts.modelA && opts.modelB) {
      cmd = `bun run index.ts --model-a "${opts.modelA}" --model-b "${opts.modelB}" --word-a "${opts.wordA}" --word-b "${opts.wordB}"${tempFlag}`;
    } else {
      cmd = `bun run index.ts --model "${opts.model}" --word-a "${opts.wordA}" --word-b "${opts.wordB}"${tempFlag}`;
    }

    const output = execSync(cmd, {
      cwd: `${import.meta.dir}/..`,
      encoding: "utf-8",
      timeout: 300_000,
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

console.log(`\n🧪 Round 5: Temperature, Prediction & Direction`);
console.log(`  Experiment A: Temperature comparison (temp=${LOW_TEMP}) — ${totalA} games`);
console.log(`  Experiment B: Prediction test (3 new pairs) — ${totalB} games`);
console.log(`  Experiment C: Cross-model direction test — ${totalC} games`);
console.log(`  Total: ${total} games\n`);

// ============================================================================
// EXPERIMENT A: Low temperature on anchor pairs
// ============================================================================
console.log("━".repeat(70));
console.log(`  EXPERIMENT A: Temperature Comparison (temp=${LOW_TEMP})`);
console.log("━".repeat(70));

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  📌 ${pair.label} at temp=${LOW_TEMP}`);

  for (const model of SOLO_MODELS) {
    const shortModel = model.split("/")[1] || model;

    // Forward
    for (let rep = 1; rep <= REPS_A; rep++) {
      runGame({
        model,
        wordA: pair.wordA,
        wordB: pair.wordB,
        temperature: LOW_TEMP,
        label: `[temp=${LOW_TEMP}] ${shortModel} — ${pair.wordA} → ${pair.wordB} (rep ${rep}/${REPS_A})`,
      });
    }

    // Reverse
    for (let rep = 1; rep <= REPS_A; rep++) {
      runGame({
        model,
        wordA: pair.wordB,
        wordB: pair.wordA,
        temperature: LOW_TEMP,
        label: `[temp=${LOW_TEMP}] ${shortModel} — ${pair.wordB} → ${pair.wordA} (rep ${rep}/${REPS_A})`,
      });
    }
  }
}

// ============================================================================
// EXPERIMENT B: Prediction test with new pairs (temp=1.0, default)
// ============================================================================
console.log("\n" + "━".repeat(70));
console.log("  EXPERIMENT B: Prediction Test (new pairs, temp=1.0)");
console.log("━".repeat(70));

for (const pair of PREDICTION_PAIRS) {
  console.log(`\n  📌 ${pair.label} — prediction: ${pair.prediction}`);

  for (const model of SOLO_MODELS) {
    const shortModel = model.split("/")[1] || model;

    // Forward
    for (let rep = 1; rep <= REPS_B; rep++) {
      runGame({
        model,
        wordA: pair.wordA,
        wordB: pair.wordB,
        label: `${shortModel} — ${pair.wordA} → ${pair.wordB} (rep ${rep}/${REPS_B})`,
      });
    }

    // Reverse
    for (let rep = 1; rep <= REPS_B; rep++) {
      runGame({
        model,
        wordA: pair.wordB,
        wordB: pair.wordA,
        label: `${shortModel} — ${pair.wordB} → ${pair.wordA} (rep ${rep}/${REPS_B})`,
      });
    }
  }
}

// ============================================================================
// EXPERIMENT C: Cross-model direction test on anchor pairs
// ============================================================================
console.log("\n" + "━".repeat(70));
console.log("  EXPERIMENT C: Cross-Model Direction Test");
console.log("━".repeat(70));

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  📌 ${pair.label} — testing model ordering`);

  for (const { modelA, modelB, label: orderLabel } of CROSS_MODEL_ORDERINGS) {
    for (let rep = 1; rep <= REPS_C; rep++) {
      runGame({
        modelA,
        modelB,
        wordA: pair.wordA,
        wordB: pair.wordB,
        label: `${orderLabel} — ${pair.wordA} ↔ ${pair.wordB} (rep ${rep}/${REPS_C})`,
      });
    }
  }
}

// --- Summary ---
console.log(`\n${"═".repeat(70)}`);
console.log(`🏁 Round 5 complete: ${completed - failures.length}/${total} succeeded`);
if (failures.length > 0) {
  console.log(`\n❌ Failures (${failures.length}):`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log();
