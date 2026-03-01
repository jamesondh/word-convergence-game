#!/usr/bin/env bun

// Round 4 Analysis: Stability & Symmetry metrics
//
// Reads all results and computes:
//   1. Attractor strength — % runs landing on same convergence word (per pair/model)
//   2. Symmetry score — how much A↔B matches B↔A
//   3. Novelty rate — % cross-model convergences not seen in solo runs
//   4. Path length variance — stability vs exploratory behavior

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

// Round 4 anchor pairs — detect by starting words (either direction)
const ANCHOR_PAIRS = [
  { words: ["nikola tesla", "mycelium"], label: "Tesla↔mycelium", claim: "network" },
  { words: ["shadow", "melody"], label: "shadow↔melody", claim: "echo" },
  { words: ["beyonce", "erosion"], label: "Beyoncé↔erosion", claim: "formation" },
  { words: ["kanye west", "lattice"], label: "Kanye↔lattice", claim: "divergence" },
];

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

// Identify round 4 results — games from after round 3 that match anchor pairs
// We use timestamps to find the newest batch, but more robustly just match on pairs
function matchesPair(result: GameResult, pair: { words: string[] }): boolean {
  const [w1, w2] = result.config.startingWords.map((w) => w.toLowerCase());
  return (
    (w1 === pair.words[0] && w2 === pair.words[1]) ||
    (w1 === pair.words[1] && w2 === pair.words[0])
  );
}

function getDirection(result: GameResult, pair: { words: string[] }): "forward" | "reverse" {
  const w1 = result.config.startingWords[0].toLowerCase();
  return w1 === pair.words[0] ? "forward" : "reverse";
}

function isCrossModel(result: GameResult): boolean {
  return result.config.modelA !== result.config.modelB;
}

function getModelKey(result: GameResult): string {
  if (isCrossModel(result)) {
    return `${shortModel(result.config.modelA)} vs ${shortModel(result.config.modelB)}`;
  }
  return shortModel(result.config.modelA);
}

// --- Filter to round 4 results ---
// Round 4 has 5 reps per condition, so we expect multiple results per pair/model/direction
// Find all games matching anchor pairs, group by count to identify the round 4 batch
// Simple approach: find games with these pairs that have 5+ instances per model/pair combo

function getR4Results(): GameResult[] {
  // Get all results matching anchor pairs
  const matching = allResults.filter((r) =>
    ANCHOR_PAIRS.some((p) => matchesPair(r, p))
  );

  // To distinguish round 4 from earlier rounds, we check for multiplicity
  // Round 4 should have 5 copies of each condition. Earlier rounds had 1.
  // Group by model+pair+direction and count
  const groups = new Map<string, GameResult[]>();
  for (const r of matching) {
    const pair = ANCHOR_PAIRS.find((p) => matchesPair(r, p))!;
    const dir = getDirection(r, pair);
    const key = `${getModelKey(r)}|${pair.label}|${dir}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  // For groups with exactly 1 result, that's from rounds 1-3.
  // For groups with >1, those include round 4 data.
  // For analysis, we want ALL matching results (including old ones for comparison),
  // but mark which are new. For now, return everything.
  return matching;
}

const r4Results = getR4Results();

console.log(`\n📊 Round 4 Analysis: Stability & Symmetry`);
console.log(`   Total matching results: ${r4Results.length}`);
console.log("═".repeat(80));

// ============================================================================
// METRIC 1: Attractor Strength
// For each pair × model, what % of runs converge on the same word?
// ============================================================================

console.log("\n\n🧲 METRIC 1: ATTRACTOR STRENGTH\n");
console.log("For each pair × model, the most common convergence word and what % of runs hit it.\n");

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  ${pair.label}  (predicted attractor: "${pair.claim}")`);
  console.log("  " + "─".repeat(76));
  console.log(
    `  ${"Model".padEnd(30)} | ${"Top Word".padEnd(14)} | ${"Hits".padEnd(6)} | ${"Total".padEnd(6)} | ${"Strength".padEnd(10)} | All Words`
  );
  console.log("  " + "─".repeat(76));

  const allModels = [
    ...SOLO_MODELS.map((m) => ({ key: shortModel(m), filter: (r: GameResult) => r.config.modelA === m && r.config.modelB === m })),
    { key: "claude-sonnet-4.6 vs gpt-5.2", filter: (r: GameResult) => r.config.modelA === "anthropic/claude-sonnet-4.6" && r.config.modelB === "openai/gpt-5.2" },
    { key: "gpt-5.2 vs claude-sonnet-4.6", filter: (r: GameResult) => r.config.modelA === "openai/gpt-5.2" && r.config.modelB === "anthropic/claude-sonnet-4.6" },
    { key: "grok-4.1-fast vs gemini-3-flash", filter: (r: GameResult) => r.config.modelA === "x-ai/grok-4.1-fast" && r.config.modelB === "google/gemini-3-flash-preview" },
    { key: "gemini-3-flash vs grok-4.1-fast", filter: (r: GameResult) => r.config.modelA === "google/gemini-3-flash-preview" && r.config.modelB === "x-ai/grok-4.1-fast" },
  ];

  for (const { key, filter } of allModels) {
    const games = r4Results.filter((r) => matchesPair(r, pair) && filter(r) && r.converged);
    if (games.length === 0) continue;

    const wordCounts = new Map<string, number>();
    for (const g of games) {
      const w = g.convergedWord!;
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }

    const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
    const [topWord, topCount] = sorted[0];
    const strength = ((topCount / games.length) * 100).toFixed(0) + "%";
    const allWords = sorted.map(([w, c]) => `${w}(${c})`).join(", ");

    console.log(
      `  ${key.padEnd(30)} | ${topWord.padEnd(14)} | ${topCount.toString().padEnd(6)} | ${games.length.toString().padEnd(6)} | ${strength.padEnd(10)} | ${allWords}`
    );
  }
}

// ============================================================================
// METRIC 2: Symmetry Score
// Does A↔B produce the same convergence word as B↔A?
// ============================================================================

console.log("\n\n🔄 METRIC 2: SYMMETRY SCORE\n");
console.log("Comparing convergence words when word order is flipped (A↔B vs B↔A).\n");

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  ${pair.label}`);
  console.log("  " + "─".repeat(70));
  console.log(
    `  ${"Model".padEnd(30)} | ${"Forward Top".padEnd(14)} | ${"Reverse Top".padEnd(14)} | Match?`
  );
  console.log("  " + "─".repeat(70));

  for (const model of SOLO_MODELS) {
    const forwardGames = r4Results.filter(
      (r) =>
        matchesPair(r, pair) &&
        getDirection(r, pair) === "forward" &&
        r.config.modelA === model &&
        !isCrossModel(r) &&
        r.converged
    );
    const reverseGames = r4Results.filter(
      (r) =>
        matchesPair(r, pair) &&
        getDirection(r, pair) === "reverse" &&
        r.config.modelA === model &&
        !isCrossModel(r) &&
        r.converged
    );

    const fwdTop = getTopWord(forwardGames);
    const revTop = getTopWord(reverseGames);
    const match = fwdTop && revTop && fwdTop === revTop ? "✅ yes" : fwdTop && revTop ? "❌ no" : "—";

    console.log(
      `  ${shortModel(model).padEnd(30)} | ${(fwdTop || "—").padEnd(14)} | ${(revTop || "—").padEnd(14)} | ${match}`
    );
  }
}

function getTopWord(games: GameResult[]): string | null {
  if (games.length === 0) return null;
  const counts = new Map<string, number>();
  for (const g of games) {
    const w = g.convergedWord!;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ============================================================================
// METRIC 3: Novelty Rate
// What % of cross-model convergence words were NOT found in either solo model?
// ============================================================================

console.log("\n\n✨ METRIC 3: NOVELTY RATE\n");
console.log("Cross-model convergence words not found in either model's solo runs.\n");

const crossPairings = [
  { a: "anthropic/claude-sonnet-4.6", b: "openai/gpt-5.2", label: "Claude vs GPT" },
  { a: "x-ai/grok-4.1-fast", b: "google/gemini-3-flash-preview", label: "Grok vs Gemini" },
];

let totalCrossGames = 0;
let totalNovel = 0;

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n  ${pair.label}`);

  // Collect all solo convergence words for this pair
  const soloWords = new Map<string, Set<string>>();
  for (const model of SOLO_MODELS) {
    const games = r4Results.filter(
      (r) => matchesPair(r, pair) && r.config.modelA === model && !isCrossModel(r) && r.converged
    );
    soloWords.set(model, new Set(games.map((g) => g.convergedWord!)));
  }

  for (const { a, b, label } of crossPairings) {
    const crossGames = r4Results.filter(
      (r) =>
        matchesPair(r, pair) &&
        isCrossModel(r) &&
        ((r.config.modelA === a && r.config.modelB === b) ||
          (r.config.modelA === b && r.config.modelB === a)) &&
        r.converged
    );

    if (crossGames.length === 0) continue;

    const soloA = soloWords.get(a) || new Set();
    const soloB = soloWords.get(b) || new Set();
    const allSolo = new Set([...soloA, ...soloB]);

    const novelWords: string[] = [];
    for (const g of crossGames) {
      if (!allSolo.has(g.convergedWord!)) {
        novelWords.push(g.convergedWord!);
      }
    }

    const novelPct = ((novelWords.length / crossGames.length) * 100).toFixed(0);
    totalCrossGames += crossGames.length;
    totalNovel += novelWords.length;

    console.log(
      `    ${label.padEnd(20)} — ${novelWords.length}/${crossGames.length} novel (${novelPct}%)` +
        (novelWords.length > 0 ? ` — words: ${[...new Set(novelWords)].join(", ")}` : "")
    );
  }
}

if (totalCrossGames > 0) {
  console.log(
    `\n  Overall novelty rate: ${totalNovel}/${totalCrossGames} (${((totalNovel / totalCrossGames) * 100).toFixed(0)}%)`
  );
}

// ============================================================================
// METRIC 4: Path Length Variance
// How stable is each model's convergence speed? Low variance = predictable.
// ============================================================================

console.log("\n\n📏 METRIC 4: PATH LENGTH VARIANCE\n");
console.log("Standard deviation of rounds-to-convergence. Lower = more predictable.\n");

console.log("─".repeat(70));
console.log(
  `${"Model".padEnd(30)} | ${"Avg Rounds".padEnd(11)} | ${"StdDev".padEnd(8)} | ${"Min".padEnd(5)} | ${"Max".padEnd(5)} | ${"Games".padEnd(6)} | Profile`
);
console.log("─".repeat(70));

for (const model of SOLO_MODELS) {
  const games = r4Results.filter(
    (r) =>
      ANCHOR_PAIRS.some((p) => matchesPair(r, p)) &&
      r.config.modelA === model &&
      !isCrossModel(r) &&
      r.converged
  );

  if (games.length === 0) continue;

  const rounds = games.map((g) => g.totalRounds);
  const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  const variance = rounds.reduce((a, b) => a + (b - avg) ** 2, 0) / rounds.length;
  const stddev = Math.sqrt(variance);
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);

  let profile = "";
  if (stddev < 0.5) profile = "🎯 robotic";
  else if (stddev < 1.0) profile = "📐 stable";
  else if (stddev < 2.0) profile = "🌊 variable";
  else profile = "🎲 chaotic";

  console.log(
    `${shortModel(model).padEnd(30)} | ${avg.toFixed(1).padEnd(11)} | ${stddev.toFixed(2).padEnd(8)} | ${min.toString().padEnd(5)} | ${max.toString().padEnd(5)} | ${games.length.toString().padEnd(6)} | ${profile}`
  );
}

// Cross-model variance
for (const { a, b, label } of crossPairings) {
  const games = r4Results.filter(
    (r) =>
      ANCHOR_PAIRS.some((p) => matchesPair(r, p)) &&
      isCrossModel(r) &&
      ((r.config.modelA === a && r.config.modelB === b) ||
        (r.config.modelA === b && r.config.modelB === a)) &&
      r.converged
  );

  if (games.length === 0) continue;

  const rounds = games.map((g) => g.totalRounds);
  const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length;
  const variance = rounds.reduce((a, b) => a + (b - avg) ** 2, 0) / rounds.length;
  const stddev = Math.sqrt(variance);
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);

  let profile = "";
  if (stddev < 0.5) profile = "🎯 robotic";
  else if (stddev < 1.0) profile = "📐 stable";
  else if (stddev < 2.0) profile = "🌊 variable";
  else profile = "🎲 chaotic";

  console.log(
    `${label.padEnd(30)} | ${avg.toFixed(1).padEnd(11)} | ${stddev.toFixed(2).padEnd(8)} | ${min.toString().padEnd(5)} | ${max.toString().padEnd(5)} | ${games.length.toString().padEnd(6)} | ${profile}`
  );
}
console.log("─".repeat(70));

// ============================================================================
// BONUS: Per-pair breakdown (all paths for deep analysis)
// ============================================================================

console.log("\n\n📋 DETAILED PATHS (all round 4 games)\n");

for (const pair of ANCHOR_PAIRS) {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`  ${pair.label}  —  predicted attractor: "${pair.claim}"`);
  console.log("═".repeat(80));

  const pairResults = r4Results
    .filter((r) => matchesPair(r, pair))
    .sort((a, b) => {
      // Sort: solo before cross, then by model, then by direction
      const aCross = isCrossModel(a) ? 1 : 0;
      const bCross = isCrossModel(b) ? 1 : 0;
      if (aCross !== bCross) return aCross - bCross;
      const aModel = getModelKey(a);
      const bModel = getModelKey(b);
      if (aModel !== bModel) return aModel.localeCompare(bModel);
      return a.timestamp.localeCompare(b.timestamp);
    });

  let lastModel = "";
  for (const r of pairResults) {
    const modelKey = getModelKey(r);
    if (modelKey !== lastModel) {
      console.log(`\n  ${modelKey}:`);
      lastModel = modelKey;
    }

    const dir = getDirection(r, pair) === "forward" ? "→" : "←";
    const path = r.rounds
      .slice(1)
      .map((round) => (round.converged ? `[${round.wordA}]` : `${round.wordA}↔${round.wordB}`))
      .join(" → ");
    const status = r.converged ? `${r.totalRounds}r → ${r.convergedWord}` : `${r.totalRounds}r ✗`;

    console.log(`    ${dir} ${status.padEnd(20)} | ${path}`);
  }
}

console.log("\n");
