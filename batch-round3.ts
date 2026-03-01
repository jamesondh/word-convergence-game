#!/usr/bin/env bun

// Round 3: Two experiments
// A) People × concepts — high entropy pairings across 6 models
// B) Cross-model matchups — Claude vs GPT, Grok vs Gemini on known pairs

import { execSync } from "child_process";

const ALL_MODELS = [
  "minimax/minimax-m2.5",
  "z-ai/glm-5",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

// --- Experiment A: People × Concepts ---
// High entropy — avoid pairings with obvious bridges
const PEOPLE_CONCEPT_PAIRS: [string, string][] = [
  ["Elon Musk", "liturgy"],
  ["Beyonce", "erosion"],
  ["Nikola Tesla", "mycelium"],
  ["Cleopatra", "fractal"],
  ["Kanye West", "lattice"],
];

// --- Experiment B: Cross-model matchups ---
// Using pairs from previous rounds for direct comparison.
// Claude vs GPT: the speed/creativity extremes
// Grok vs Gemini: both fast-but-weird, different flavors
const CROSS_MODEL_GAMES: { modelA: string; modelB: string; wordA: string; wordB: string }[] = [
  // Claude (A) vs GPT (B) — on pairs where they diverged most in rounds 1-2
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "openai/gpt-5.2", wordA: "shadow", wordB: "melody" },
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "openai/gpt-5.2", wordA: "skull", wordB: "garden" },
  { modelA: "anthropic/claude-sonnet-4.6", modelB: "openai/gpt-5.2", wordA: "vertigo", wordB: "mycelium" },

  // Grok (A) vs Gemini (B) — both fast/weird, different strategies
  { modelA: "x-ai/grok-4.1-fast", modelB: "google/gemini-3-flash-preview", wordA: "hammer", wordB: "butterfly" },
  { modelA: "x-ai/grok-4.1-fast", modelB: "google/gemini-3-flash-preview", wordA: "palimpsest", wordB: "thunder" },
  { modelA: "x-ai/grok-4.1-fast", modelB: "google/gemini-3-flash-preview", wordA: "nostalgia", wordB: "isotope" },
];

const totalA = ALL_MODELS.length * PEOPLE_CONCEPT_PAIRS.length;
const totalB = CROSS_MODEL_GAMES.length;
const total = totalA + totalB;
let completed = 0;
let failures: string[] = [];

console.log(`\n🧪 Round 3`);
console.log(`  Experiment A: ${ALL_MODELS.length} models × ${PEOPLE_CONCEPT_PAIRS.length} people↔concept pairs = ${totalA} games`);
console.log(`  Experiment B: ${totalB} cross-model matchups`);
console.log(`  Total: ${total} games\n`);

// --- Run Experiment A ---
console.log("━".repeat(60));
console.log("  EXPERIMENT A: People × Concepts");
console.log("━".repeat(60));

for (const [wordA, wordB] of PEOPLE_CONCEPT_PAIRS) {
  for (const model of ALL_MODELS) {
    completed++;
    const label = `[${completed}/${total}] ${model} — ${wordA} ↔ ${wordB}`;
    console.log(`\n${"═".repeat(60)}`);
    console.log(label);
    console.log("═".repeat(60));

    try {
      const output = execSync(
        `bun run index.ts --model "${model}" --word-a "${wordA}" --word-b "${wordB}"`,
        {
          encoding: "utf-8",
          timeout: 300_000,
          env: { ...process.env, PATH: `/home/jameson/.bun/bin:${process.env.PATH}` },
        }
      );
      console.log(output);
    } catch (err: any) {
      const msg = `FAILED: ${label}`;
      failures.push(msg);
      console.error(`\n  ❌ ${msg}`);
      console.error(`  ${err.message?.slice(0, 200)}`);
    }
  }
}

// --- Run Experiment B ---
console.log("\n" + "━".repeat(60));
console.log("  EXPERIMENT B: Cross-Model Matchups");
console.log("━".repeat(60));

for (const { modelA, modelB, wordA, wordB } of CROSS_MODEL_GAMES) {
  completed++;
  const shortA = modelA.split("/")[1] || modelA;
  const shortB = modelB.split("/")[1] || modelB;
  const label = `[${completed}/${total}] ${shortA} vs ${shortB} — ${wordA} ↔ ${wordB}`;
  console.log(`\n${"═".repeat(60)}`);
  console.log(label);
  console.log("═".repeat(60));

  try {
    const output = execSync(
      `bun run index.ts --model-a "${modelA}" --model-b "${modelB}" --word-a "${wordA}" --word-b "${wordB}"`,
      {
        encoding: "utf-8",
        timeout: 300_000,
        env: { ...process.env, PATH: `/home/jameson/.bun/bin:${process.env.PATH}` },
      }
    );
    console.log(output);
  } catch (err: any) {
    const msg = `FAILED: ${label}`;
    failures.push(msg);
    console.error(`\n  ❌ ${msg}`);
    console.error(`  ${err.message?.slice(0, 200)}`);
  }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`🏁 Round 3 complete: ${completed - failures.length}/${total} succeeded`);
if (failures.length > 0) {
  console.log(`\n❌ Failures:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log();
