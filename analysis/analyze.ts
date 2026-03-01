#!/usr/bin/env bun

import { readdirSync, readFileSync } from "fs";

interface GameResult {
  timestamp: string;
  config: {
    modelA: string;
    modelB: string;
    maxRounds: number;
    startingWords: [string, string];
  };
  rounds: { number: number; wordA: string; wordB: string; converged: boolean }[];
  converged: boolean;
  totalRounds: number;
  convergedWord: string | null;
  uniqueWords: string[];
}

const RESULTS_DIR = "./results";

const EASY_PAIRS = ["mountain-ocean", "shadow-melody", "hammer-butterfly", "volcano-clock", "skull-garden"];
const HARD_PAIRS = ["palimpsest-thunder", "nostalgia-isotope", "liturgy-erosion", "vertigo-mycelium", "paradox-amber"];
const ALL_PAIRS = [...EASY_PAIRS, ...HARD_PAIRS];

const modelOrder = [
  "minimax/minimax-m2.5",
  "z-ai/glm-5",
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

// Load all results
const files = readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json"));
const results: GameResult[] = files.map((f) =>
  JSON.parse(readFileSync(`${RESULTS_DIR}/${f}`, "utf-8"))
);

// Filter to test pairs only
const testResults = results.filter((r) => {
  const pair = `${r.config.startingWords[0]}-${r.config.startingWords[1]}`;
  return ALL_PAIRS.includes(pair);
});

// Group by model
const byModel = new Map<string, GameResult[]>();
for (const r of testResults) {
  const model = r.config.modelA;
  if (!byModel.has(model)) byModel.set(model, []);
  byModel.get(model)!.push(r);
}

function printTable(title: string, pairKeys: string[]) {
  console.log(`\n${title}\n`);
  console.log("═".repeat(100));
  const pairs = pairKeys.map((p) => {
    const [a, b] = p.split("-");
    return `${a.slice(0, 6)}↔${b.slice(0, 6)}`;
  });
  console.log(
    `${"Model".padEnd(26)} | ${pairs.map((p) => p.padEnd(14)).join(" | ")} | Avg`
  );
  console.log("─".repeat(100));

  for (const model of modelOrder) {
    const games = byModel.get(model) || [];
    const cells: string[] = [];
    const roundCounts: number[] = [];

    for (const pairKey of pairKeys) {
      const [wA, wB] = pairKey.split("-");
      const game = games.find(
        (g) => g.config.startingWords[0] === wA && g.config.startingWords[1] === wB
      );
      if (!game) {
        cells.push("—".padEnd(14));
      } else if (game.converged) {
        const word = game.convergedWord!.length > 8
          ? game.convergedWord!.slice(0, 7) + "…"
          : game.convergedWord!;
        const label = `${game.totalRounds}r ${word}`;
        cells.push(label.padEnd(14));
        roundCounts.push(game.totalRounds);
      } else {
        cells.push(`${game.totalRounds}r ✗`.padEnd(14));
        roundCounts.push(game.totalRounds);
      }
    }

    const avg = roundCounts.length > 0
      ? (roundCounts.reduce((a, b) => a + b, 0) / roundCounts.length).toFixed(1)
      : "—";
    const shortModel = (model.split("/")[1] || model).slice(0, 25);
    console.log(`${shortModel.padEnd(26)} | ${cells.join(" | ")} | ${avg}`);
  }
  console.log("═".repeat(100));
}

// --- Tables ---
printTable("📊 EASY PAIRS (concrete nouns)", EASY_PAIRS);
printTable("📊 HARD PAIRS (abstract/rare words)", HARD_PAIRS);

// --- Combined stats ---
console.log("\n\n📈 COMBINED STATS (10 pairs per model)\n");
console.log("─".repeat(90));
console.log(
  `${"Model".padEnd(26)} | ${"Games".padEnd(6)} | ${"Avg Rnd".padEnd(8)} | ${"2-round%".padEnd(9)} | ${"Vocab".padEnd(6)} | ${"Easy Avg".padEnd(9)} | Hard Avg`
);
console.log("─".repeat(90));

for (const model of modelOrder) {
  const games = byModel.get(model) || [];
  const successful = games.filter((g) => g.converged);
  if (successful.length === 0) continue;

  const shortModel = (model.split("/")[1] || model).slice(0, 25);
  const avgRounds = (successful.reduce((a, g) => a + g.totalRounds, 0) / successful.length).toFixed(1);
  const twoRoundPct = ((successful.filter((g) => g.totalRounds === 2).length / successful.length) * 100).toFixed(0) + "%";
  const uniqueVocab = new Set(successful.flatMap((g) => g.uniqueWords)).size;

  // Split easy vs hard
  const easyGames = successful.filter((g) => {
    const pair = `${g.config.startingWords[0]}-${g.config.startingWords[1]}`;
    return EASY_PAIRS.includes(pair);
  });
  const hardGames = successful.filter((g) => {
    const pair = `${g.config.startingWords[0]}-${g.config.startingWords[1]}`;
    return HARD_PAIRS.includes(pair);
  });
  const easyAvg = easyGames.length > 0
    ? (easyGames.reduce((a, g) => a + g.totalRounds, 0) / easyGames.length).toFixed(1)
    : "—";
  const hardAvg = hardGames.length > 0
    ? (hardGames.reduce((a, g) => a + g.totalRounds, 0) / hardGames.length).toFixed(1)
    : "—";

  console.log(
    `${shortModel.padEnd(26)} | ${successful.length.toString().padEnd(6)} | ${avgRounds.padEnd(8)} | ${twoRoundPct.padEnd(9)} | ${uniqueVocab.toString().padEnd(6)} | ${easyAvg.padEnd(9)} | ${hardAvg}`
  );
}
console.log("─".repeat(90));

// --- Convergence word comparison for hard pairs ---
console.log("\n\n📝 CONVERGENCE WORDS — HARD PAIRS\n");
for (const pairKey of HARD_PAIRS) {
  const [wA, wB] = pairKey.split("-");
  console.log(`\n  ${wA} ↔ ${wB}:`);
  for (const model of modelOrder) {
    const games = byModel.get(model) || [];
    const game = games.find(
      (g) => g.config.startingWords[0] === wA && g.config.startingWords[1] === wB
    );
    const shortModel = (model.split("/")[1] || model).padEnd(26);
    if (!game) {
      console.log(`    ${shortModel} —`);
    } else if (game.converged) {
      const path = game.rounds
        .slice(1)
        .map((r) => (r.converged ? `[${r.wordA}]` : `${r.wordA}↔${r.wordB}`))
        .join(" → ");
      console.log(`    ${shortModel} ${game.convergedWord?.padEnd(14)} (${game.totalRounds}r) | ${path}`);
    } else {
      console.log(`    ${shortModel} ✗ (${game.totalRounds}r)`);
    }
  }
}

// --- Most interesting paths across ALL games ---
console.log("\n\n🔥 MOST INTERESTING PATHS (3+ rounds)\n");
const allSuccessful = testResults
  .filter((r) => r.converged && r.totalRounds >= 3)
  .sort((a, b) => b.totalRounds - a.totalRounds);

for (const game of allSuccessful.slice(0, 15)) {
  const shortModel = (game.config.modelA.split("/")[1] || game.config.modelA).padEnd(22);
  const pair = game.config.startingWords.join("↔");
  const path = game.rounds
    .map((r) => (r.converged ? `[${r.wordA}]` : `${r.wordA}↔${r.wordB}`))
    .join(" → ");
  console.log(`  ${shortModel} ${pair.padEnd(22)} ${path}`);
}

// --- The "echo" / "time" attractor analysis ---
console.log("\n\n🧲 ATTRACTOR WORDS (convergence words that appear across multiple models)\n");
const convergenceWordCounts = new Map<string, { models: string[]; pairs: string[] }>();
for (const game of testResults.filter((g) => g.converged)) {
  const word = game.convergedWord!;
  if (!convergenceWordCounts.has(word)) convergenceWordCounts.set(word, { models: [], pairs: [] });
  const entry = convergenceWordCounts.get(word)!;
  const shortModel = game.config.modelA.split("/")[1] || game.config.modelA;
  entry.models.push(shortModel);
  entry.pairs.push(game.config.startingWords.join("↔"));
}

const attractors = [...convergenceWordCounts.entries()]
  .filter(([_, v]) => v.models.length >= 2)
  .sort((a, b) => b[1].models.length - a[1].models.length);

for (const [word, { models, pairs }] of attractors) {
  const uniqueModels = [...new Set(models)];
  const uniquePairs = [...new Set(pairs)];
  console.log(`  "${word}" — ${models.length}× (${uniqueModels.length} models, ${uniquePairs.length} pairs)`);
  console.log(`    Models: ${uniqueModels.join(", ")}`);
  console.log(`    Pairs:  ${uniquePairs.join(", ")}`);
  console.log();
}

console.log();
