#!/usr/bin/env bun

// Batch runner: hard word pairs across 6 models (kimi excluded — too slow/unreliable).
// Tests whether "instant convergence" models (Claude, Gemini) maintain their speed
// on abstract/cross-domain pairs, or get forced into longer paths like GPT/Grok.

import { execSync } from "child_process";

const MODELS = [
  "minimax/minimax-m2.5",
  "z-ai/glm-5",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

const WORD_PAIRS: [string, string][] = [
  ["palimpsest", "thunder"],    // layered erasure vs raw force
  ["nostalgia", "isotope"],     // temporal emotion vs nuclear physics
  ["liturgy", "erosion"],       // ritual vs geological process
  ["vertigo", "mycelium"],      // sensation vs biology
  ["paradox", "amber"],         // logical concept vs ancient material
];

const total = MODELS.length * WORD_PAIRS.length;
let completed = 0;
let failures: string[] = [];

console.log(`\n🧪 Hard batch: ${MODELS.length} models × ${WORD_PAIRS.length} word pairs = ${total} games\n`);

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
          timeout: 300_000, // 5 min per game (harder pairs may take longer)
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
console.log(`🏁 Hard batch complete: ${completed - failures.length}/${total} succeeded`);
if (failures.length > 0) {
  console.log(`\n❌ Failures:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log();
