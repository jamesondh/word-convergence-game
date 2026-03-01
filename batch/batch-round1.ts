#!/usr/bin/env bun

// Batch runner: runs the same word pairs across multiple models sequentially.
// Usage: bun run batch/batch-round1.ts

import { execSync } from "child_process";

const MODELS = [
  "minimax/minimax-m2.5",
  "z-ai/glm-5",
  "moonshotai/kimi-k2.5",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

const WORD_PAIRS: [string, string][] = [
  ["mountain", "ocean"],     // nature vs nature, big conceptual gap
  ["shadow", "melody"],      // abstract/sensory, cross-domain
  ["hammer", "butterfly"],   // tool vs animal, hard vs soft
  ["volcano", "clock"],      // nature vs human artifact
  ["skull", "garden"],       // death vs life
];

const total = MODELS.length * WORD_PAIRS.length;
let completed = 0;
let failures: string[] = [];

console.log(`\n🧪 Batch run: ${MODELS.length} models × ${WORD_PAIRS.length} word pairs = ${total} games\n`);

for (const [wordA, wordB] of WORD_PAIRS) {
  for (const model of MODELS) {
    completed++;
    const label = `[${completed}/${total}] ${model} — ${wordA} ↔ ${wordB}`;
    console.log(`\n${"═".repeat(60)}`);
    console.log(label);
    console.log("═".repeat(60));

    try {
      const output = execSync(
        `bun run index.ts --model "${model}" --word-a "${wordA}" --word-b "${wordB}"`,
        {
          cwd: `${import.meta.dir}/..`,
          encoding: "utf-8",
          timeout: 180_000, // 3 min per game
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

console.log(`\n${"═".repeat(60)}`);
console.log(`🏁 Batch complete: ${completed - failures.length}/${total} succeeded`);
if (failures.length > 0) {
  console.log(`\n❌ Failures:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log();
