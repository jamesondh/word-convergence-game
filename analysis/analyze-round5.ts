#!/usr/bin/env bun

// Round 5 Analysis: Temperature, Prediction & Direction
//
// Compares low-temp (0.3) vs high-temp (1.0) attractor behavior,
// tests basin predictions on new pairs, and analyzes cross-model direction effects.

import { readdirSync, readFileSync } from "fs";

interface GameResult {
  timestamp: string;
  config: {
    modelA: string;
    modelB: string;
    maxRounds: number;
    temperature?: number;
    startingWords: [string, string];
  };
  rounds: { number: number; wordA: string; wordB: string; converged: boolean }[];
  converged: boolean;
  totalRounds: number;
  convergedWord: string | null;
  uniqueWords: string[];
}

const RESULTS_DIR = "./results";

const SOLO_MODELS = [
  "google/gemini-3-flash-preview",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-sonnet-4.6",
  "openai/gpt-5.2",
];

function shortModel(model: string): string {
  return (model.split("/")[1] || model).replace(/-preview$/, "");
}

// Load all results
const files = readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json"));
const allResults: GameResult[] = files.map((f) =>
  JSON.parse(readFileSync(`${RESULTS_DIR}/${f}`, "utf-8"))
);

function matchesPairWords(result: GameResult, w1: string, w2: string): boolean {
  const [a, b] = result.config.startingWords.map((w) => w.toLowerCase());
  return (a === w1.toLowerCase() && b === w2.toLowerCase()) ||
         (a === w2.toLowerCase() && b === w1.toLowerCase());
}

function isCrossModel(r: GameResult): boolean {
  return r.config.modelA !== r.config.modelB;
}

function getTemp(r: GameResult): number {
  return r.config.temperature ?? 1.0; // old results default to 1.0
}

function getTopWord(games: GameResult[]): { word: string; count: number; total: number } | null {
  const converged = games.filter((g) => g.converged);
  if (converged.length === 0) return null;
  const counts = new Map<string, number>();
  for (const g of converged) counts.set(g.convergedWord!, (counts.get(g.convergedWord!) || 0) + 1);
  const [word, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { word, count, total: converged.length };
}

function getWordDist(games: GameResult[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const g of games.filter((g) => g.converged)) {
    counts.set(g.convergedWord!, (counts.get(g.convergedWord!) || 0) + 1);
  }
  return counts;
}

// ============================================================================
// EXPERIMENT A: Temperature Comparison
// ============================================================================

console.log(`\n📊 Round 5 Analysis`);
console.log("═".repeat(80));

console.log("\n\n🌡️  EXPERIMENT A: TEMPERATURE COMPARISON (0.3 vs 1.0)\n");
console.log("Do semantic basins get deeper at low temperature, or stay the same?\n");

const ANCHOR_PAIRS = [
  { w1: "nikola tesla", w2: "mycelium", label: "Tesla↔mycelium", predicted: "network" },
  { w1: "shadow", w2: "melody", label: "shadow↔melody", predicted: "echo" },
  { w1: "beyonce", w2: "erosion", label: "Beyoncé↔erosion", predicted: "formation" },
  { w1: "kanye west", w2: "lattice", label: "Kanye↔lattice", predicted: "divergence" },
];

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  ${pair.label}  (predicted: "${pair.predicted}")`);
  console.log("  " + "─".repeat(76));
  console.log(
    `  ${"Model".padEnd(28)} | ${"Temp".padEnd(5)} | ${"Top Word".padEnd(14)} | ${"Strength".padEnd(10)} | All Words`
  );
  console.log("  " + "─".repeat(76));

  for (const model of SOLO_MODELS) {
    for (const temp of [1.0, 0.3]) {
      const games = allResults.filter(
        (r) =>
          matchesPairWords(r, pair.w1, pair.w2) &&
          r.config.modelA === model &&
          !isCrossModel(r) &&
          Math.abs(getTemp(r) - temp) < 0.05 &&
          r.converged
      );

      if (games.length === 0) continue;

      const dist = getWordDist(games);
      const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1]);
      const [topWord, topCount] = sorted[0];
      const strength = ((topCount / games.length) * 100).toFixed(0) + "%";
      const allWords = sorted.map(([w, c]) => `${w}(${c})`).join(", ");

      console.log(
        `  ${shortModel(model).padEnd(28)} | ${temp.toFixed(1).padEnd(5)} | ${topWord.padEnd(14)} | ${strength.padEnd(10)} | ${allWords}`
      );
    }
    console.log("  " + "·".repeat(76));
  }
}

// Temperature summary: basin depth changes
console.log("\n\n  📈 TEMPERATURE EFFECT SUMMARY\n");
console.log("  " + "─".repeat(60));
console.log(
  `  ${"Pair".padEnd(22)} | ${"Model".padEnd(22)} | ${"T=1.0".padEnd(8)} | ${"T=0.3".padEnd(8)} | Δ`
);
console.log("  " + "─".repeat(60));

for (const pair of ANCHOR_PAIRS) {
  for (const model of SOLO_MODELS) {
    const high = allResults.filter(
      (r) => matchesPairWords(r, pair.w1, pair.w2) && r.config.modelA === model && !isCrossModel(r) && Math.abs(getTemp(r) - 1.0) < 0.05 && r.converged
    );
    const low = allResults.filter(
      (r) => matchesPairWords(r, pair.w1, pair.w2) && r.config.modelA === model && !isCrossModel(r) && Math.abs(getTemp(r) - 0.3) < 0.05 && r.converged
    );

    if (high.length === 0 || low.length === 0) continue;

    const highTop = getTopWord(high);
    const lowTop = getTopWord(low);
    if (!highTop || !lowTop) continue;

    const highPct = ((highTop.count / highTop.total) * 100).toFixed(0) + "%";
    const lowPct = ((lowTop.count / lowTop.total) * 100).toFixed(0) + "%";
    const delta = ((lowTop.count / lowTop.total) - (highTop.count / highTop.total)) * 100;
    const deltaStr = delta > 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
    const emoji = delta > 10 ? "⬆️" : delta < -10 ? "⬇️" : "➡️";

    console.log(
      `  ${pair.label.padEnd(22)} | ${shortModel(model).padEnd(22)} | ${highPct.padEnd(8)} | ${lowPct.padEnd(8)} | ${deltaStr} ${emoji}`
    );
  }
}

// ============================================================================
// EXPERIMENT B: Prediction Test
// ============================================================================

console.log("\n\n🔮 EXPERIMENT B: PREDICTION TEST\n");
console.log("Can the basin framework predict attractor behavior for unseen pairs?\n");

const PREDICTIONS = [
  { w1: "einstein", w2: "ocean", label: "Einstein↔ocean", prediction: "DEEP", predictedWord: "wave/energy" },
  { w1: "shakespeare", w2: "algorithm", label: "Shakespeare↔algorithm", prediction: "MODERATE", predictedWord: "pattern/verse/meter" },
  { w1: "beyonce", w2: "mycelium", label: "Beyoncé↔mycelium", prediction: "FLAT", predictedWord: "none (high divergence)" },
];

for (const pred of PREDICTIONS) {
  console.log(`\n  ${pred.label}`);
  console.log(`  Prediction: ${pred.prediction} basin — expected attractor: ${pred.predictedWord}`);
  console.log("  " + "─".repeat(76));
  console.log(
    `  ${"Model".padEnd(28)} | ${"Top Word".padEnd(14)} | ${"Strength".padEnd(10)} | ${"Rounds".padEnd(8)} | All Words`
  );
  console.log("  " + "─".repeat(76));

  let allConvergenceWords: string[] = [];
  let allStrengths: number[] = [];

  for (const model of SOLO_MODELS) {
    const games = allResults.filter(
      (r) =>
        matchesPairWords(r, pred.w1, pred.w2) &&
        r.config.modelA === model &&
        !isCrossModel(r) &&
        r.converged
    );

    if (games.length === 0) continue;

    const dist = getWordDist(games);
    const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1]);
    const [topWord, topCount] = sorted[0];
    const strength = topCount / games.length;
    const strengthStr = (strength * 100).toFixed(0) + "%";
    const avgRounds = (games.reduce((a, g) => a + g.totalRounds, 0) / games.length).toFixed(1);
    const allWords = sorted.map(([w, c]) => `${w}(${c})`).join(", ");

    allConvergenceWords.push(...games.map((g) => g.convergedWord!));
    allStrengths.push(strength);

    console.log(
      `  ${shortModel(model).padEnd(28)} | ${topWord.padEnd(14)} | ${strengthStr.padEnd(10)} | ${avgRounds.padEnd(8)} | ${allWords}`
    );
  }

  // Verdict
  const uniqueWords = new Set(allConvergenceWords);
  const avgStrength = allStrengths.length > 0
    ? allStrengths.reduce((a, b) => a + b, 0) / allStrengths.length
    : 0;

  let verdict = "";
  if (avgStrength > 0.7) verdict = "DEEP ✅";
  else if (avgStrength > 0.35) verdict = "MODERATE ✅";
  else verdict = "FLAT ✅";

  // Check if the measured type matches prediction
  const measured = avgStrength > 0.7 ? "DEEP" : avgStrength > 0.35 ? "MODERATE" : "FLAT";
  const correct = measured === pred.prediction;

  console.log(`\n  Verdict: ${verdict} (avg strength: ${(avgStrength * 100).toFixed(0)}%, unique words: ${uniqueWords.size})`);
  console.log(`  Prediction ${correct ? "✅ CORRECT" : "❌ WRONG"} — predicted ${pred.prediction}, measured ${measured}`);
}

// ============================================================================
// EXPERIMENT C: Cross-Model Direction Test
// ============================================================================

console.log("\n\n🔀 EXPERIMENT C: CROSS-MODEL DIRECTION TEST\n");
console.log("Does Player A vs Player B assignment affect cross-model convergence?\n");

const CROSS_PAIRINGS = [
  { a: "anthropic/claude-sonnet-4.6", b: "openai/gpt-5.2", label: "Claude ↔ GPT" },
  { a: "x-ai/grok-4.1-fast", b: "google/gemini-3-flash-preview", label: "Grok ↔ Gemini" },
  { a: "anthropic/claude-sonnet-4.6", b: "x-ai/grok-4.1-fast", label: "Claude ↔ Grok" },
];

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  ${pair.label}`);
  console.log("  " + "─".repeat(76));
  console.log(
    `  ${"Ordering".padEnd(28)} | ${"Top Word".padEnd(14)} | ${"Avg Rnds".padEnd(9)} | ${"Games".padEnd(6)} | All Words`
  );
  console.log("  " + "─".repeat(76));

  for (const { a, b, label } of CROSS_PAIRINGS) {
    // A as Player A
    const gamesAB = allResults.filter(
      (r) =>
        matchesPairWords(r, pair.w1, pair.w2) &&
        r.config.modelA === a &&
        r.config.modelB === b &&
        r.converged
    );

    // B as Player A (reversed model ordering)
    const gamesBA = allResults.filter(
      (r) =>
        matchesPairWords(r, pair.w1, pair.w2) &&
        r.config.modelA === b &&
        r.config.modelB === a &&
        r.converged
    );

    for (const [games, orderLabel] of [[gamesAB, `${shortModel(a)}→${shortModel(b)}`], [gamesBA, `${shortModel(b)}→${shortModel(a)}`]] as [GameResult[], string][]) {
      if (games.length === 0) continue;
      const dist = getWordDist(games);
      const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1]);
      const [topWord, topCount] = sorted[0];
      const avgRounds = (games.reduce((a, g) => a + g.totalRounds, 0) / games.length).toFixed(1);
      const allWords = sorted.map(([w, c]) => `${w}(${c})`).join(", ");

      console.log(
        `  ${orderLabel.padEnd(28)} | ${topWord.padEnd(14)} | ${avgRounds.padEnd(9)} | ${games.length.toString().padEnd(6)} | ${allWords}`
      );
    }
    console.log("  " + "·".repeat(76));
  }
}

// Direction effect summary
console.log("\n\n  📈 DIRECTION EFFECT SUMMARY\n");
console.log("  Average rounds by model ordering (lower = faster convergence):\n");

for (const { a, b, label } of CROSS_PAIRINGS) {
  const gamesAB = allResults.filter(
    (r) =>
      ANCHOR_PAIRS.some((p) => matchesPairWords(r, p.w1, p.w2)) &&
      r.config.modelA === a &&
      r.config.modelB === b &&
      r.converged
  );
  const gamesBA = allResults.filter(
    (r) =>
      ANCHOR_PAIRS.some((p) => matchesPairWords(r, p.w1, p.w2)) &&
      r.config.modelA === b &&
      r.config.modelB === a &&
      r.converged
  );

  if (gamesAB.length === 0 && gamesBA.length === 0) continue;

  const avgAB = gamesAB.length > 0 ? (gamesAB.reduce((a, g) => a + g.totalRounds, 0) / gamesAB.length).toFixed(1) : "—";
  const avgBA = gamesBA.length > 0 ? (gamesBA.reduce((a, g) => a + g.totalRounds, 0) / gamesBA.length).toFixed(1) : "—";

  console.log(`  ${label}: ${shortModel(a)} leads → avg ${avgAB} rounds | ${shortModel(b)} leads → avg ${avgBA} rounds`);
}

// ============================================================================
// BONUS: All round 5 detailed paths
// ============================================================================

console.log("\n\n📋 DETAILED PATHS\n");

// Low-temp games
const lowTempGames = allResults
  .filter((r) => Math.abs(getTemp(r) - 0.3) < 0.05)
  .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

if (lowTempGames.length > 0) {
  console.log("═".repeat(80));
  console.log("  LOW TEMPERATURE (0.3) GAMES");
  console.log("═".repeat(80));

  for (const pair of ANCHOR_PAIRS) {
    const pairGames = lowTempGames.filter((r) => matchesPairWords(r, pair.w1, pair.w2));
    if (pairGames.length === 0) continue;

    console.log(`\n  ${pair.label}:`);
    let lastModel = "";
    for (const r of pairGames) {
      const modelKey = isCrossModel(r) ? `${shortModel(r.config.modelA)} vs ${shortModel(r.config.modelB)}` : shortModel(r.config.modelA);
      if (modelKey !== lastModel) {
        console.log(`\n    ${modelKey}:`);
        lastModel = modelKey;
      }
      const path = r.rounds
        .slice(1)
        .map((round) => (round.converged ? `[${round.wordA}]` : `${round.wordA}↔${round.wordB}`))
        .join(" → ");
      const status = r.converged ? `${r.totalRounds}r → ${r.convergedWord}` : `${r.totalRounds}r ✗`;
      console.log(`      ${status.padEnd(22)} | ${path}`);
    }
  }
}

// Prediction test games
console.log("\n" + "═".repeat(80));
console.log("  PREDICTION TEST GAMES");
console.log("═".repeat(80));

for (const pred of PREDICTIONS) {
  const pairGames = allResults
    .filter((r) => matchesPairWords(r, pred.w1, pred.w2))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (pairGames.length === 0) continue;

  console.log(`\n  ${pred.label} (prediction: ${pred.prediction}):`);
  let lastModel = "";
  for (const r of pairGames) {
    const modelKey = isCrossModel(r) ? `${shortModel(r.config.modelA)} vs ${shortModel(r.config.modelB)}` : shortModel(r.config.modelA);
    if (modelKey !== lastModel) {
      console.log(`\n    ${modelKey}:`);
      lastModel = modelKey;
    }
    const path = r.rounds
      .slice(1)
      .map((round) => (round.converged ? `[${round.wordA}]` : `${round.wordA}↔${round.wordB}`))
      .join(" → ");
    const status = r.converged ? `${r.totalRounds}r → ${r.convergedWord}` : `${r.totalRounds}r ✗`;
    console.log(`      ${status.padEnd(22)} | ${path}`);
  }
}

console.log("\n");
