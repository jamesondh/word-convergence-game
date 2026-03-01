#!/usr/bin/env bun

import { WORDS } from "./words";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in environment or .env file");
  process.exit(1);
}

const DEFAULT_MODEL = "minimax/minimax-m2.5";
const DEFAULT_MAX_ROUNDS = 20;
const DEFAULT_TEMPERATURE = 1.0;
const MAX_RETRIES = 3;
const RESULTS_DIR = "./results";

// --- Types ---

interface GameConfig {
  modelA: string;
  modelB: string;
  maxRounds: number;
  temperature: number;
  wordA: string;
  wordB: string;
}

interface Round {
  number: number;
  wordA: string;
  wordB: string;
  converged: boolean;
}

interface GameResult {
  timestamp: string;
  config: {
    modelA: string;
    modelB: string;
    maxRounds: number;
    temperature: number;
    startingWords: [string, string];
  };
  rounds: Round[];
  converged: boolean;
  totalRounds: number;
  convergedWord: string | null;
  uniqueWords: string[];
}

// --- API ---

async function chat(
  model: string,
  messages: { role: "system" | "user"; content: string }[],
  temperature: number = DEFAULT_TEMPERATURE
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(`OpenRouter API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) return content;

    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Empty response from model after retries");
}

// --- Word processing ---

function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 4)
    return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes"))
    return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3)
    return word.slice(0, -1);
  return word;
}

function extractWord(response: string): string {
  const trimmed = response.trim().toLowerCase();
  // Single word
  if (/^[a-z]+(-[a-z]+)?$/.test(trimmed)) return singularize(trimmed);

  // Bold or quoted
  const boldMatch = trimmed.match(/\*\*([a-z]+(?:-[a-z]+)?)\*\*/);
  if (boldMatch) return singularize(boldMatch[1]);
  const quoteMatch = trimmed.match(/["']([a-z]+(?:-[a-z]+)?)["']/);
  if (quoteMatch) return singularize(quoteMatch[1]);

  // First all-alpha word
  const words = trimmed.split(/\s+/);
  const firstWord = words.find((w) => /^[a-z]+(-[a-z]+)?$/.test(w));
  if (firstWord) return singularize(firstWord);

  // Last resort
  const cleaned = trimmed
    .replace(/[^a-z\s-]/g, "")
    .trim()
    .split(/\s+/)[0];
  return singularize(
    cleaned || trimmed.split(/\s+/)[0].replace(/[^a-z-]/g, "")
  );
}

function pickRandomWord(exclude?: string): string {
  let word: string;
  do {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (word === exclude);
  return word;
}

// --- Game ---

async function playGame(config: GameConfig): Promise<GameResult> {
  const rounds: Round[] = [];
  const sameModel = config.modelA === config.modelB;

  console.log("\n🎮 Starting Convergence Game");
  if (sameModel) {
    console.log(`   Model: ${config.modelA}`);
  } else {
    console.log(`   Model A: ${config.modelA}`);
    console.log(`   Model B: ${config.modelB}`);
  }
  console.log(`   Starting words: ${config.wordA} ↔ ${config.wordB}`);
  console.log(`   Temperature: ${config.temperature}`);
  console.log(`   Max rounds: ${config.maxRounds}`);
  console.log("─".repeat(50));

  // Round 1: dictionary words (no LLM call needed)
  const convergedR1 = config.wordA === config.wordB;
  rounds.push({ number: 1, wordA: config.wordA, wordB: config.wordB, converged: convergedR1 });

  console.log(
    `\n  Round  1:  ${config.wordA}  ↔  ${config.wordB}${convergedR1 ? "  ✅" : ""}`
  );

  if (convergedR1) {
    return buildResult(config, rounds, true, 1);
  }

  // Convergence rounds
  const convergeSystem = `You are playing Convergence. Two players each say a word. The goal: say the SAME word as the other player.

Rules:
- Say exactly ONE word
- Pick a word that conceptually bridges or connects the two most recent words
- Don't repeat any previously used word
- Just the word, nothing else — no explanation, no quotes, no punctuation`;

  for (let round = 2; round <= config.maxRounds; round++) {
    const roundHistory = rounds
      .map((r) => `  Round ${r.number}: Player A said "${r.wordA}", Player B said "${r.wordB}"`)
      .join("\n");

    const lastRound = rounds[rounds.length - 1];
    const allUsedWords = rounds.flatMap((r) => [r.wordA, r.wordB]);

    const promptA = `Game history:\n${roundHistory}\n\nYou are Player A. The most recent words were "${lastRound.wordA}" and "${lastRound.wordB}".\nAlready used words (do NOT repeat): ${allUsedWords.join(", ")}\n\nSay one word that bridges these two concepts. Just the word.`;
    const promptB = `Game history:\n${roundHistory}\n\nYou are Player B. The most recent words were "${lastRound.wordA}" and "${lastRound.wordB}".\nAlready used words (do NOT repeat): ${allUsedWords.join(", ")}\n\nSay one word that bridges these two concepts. Just the word.`;

    const [rawA, rawB] = await Promise.all([
      chat(config.modelA, [
        { role: "system", content: convergeSystem },
        { role: "user", content: promptA },
      ], config.temperature),
      chat(config.modelB, [
        { role: "system", content: convergeSystem },
        { role: "user", content: promptB },
      ], config.temperature),
    ]);

    const wordA = extractWord(rawA);
    const wordB = extractWord(rawB);
    const converged = wordA === wordB;
    rounds.push({ number: round, wordA, wordB, converged });

    console.log(
      `  Round ${round.toString().padStart(2)}:  ${wordA}  ↔  ${wordB}${converged ? "  ✅" : ""}`
    );

    if (converged) {
      return buildResult(config, rounds, true, round);
    }
  }

  return buildResult(config, rounds, false, config.maxRounds);
}

function buildResult(
  config: GameConfig,
  rounds: Round[],
  converged: boolean,
  totalRounds: number
): GameResult {
  const allWords = [...new Set(rounds.flatMap((r) => [r.wordA, r.wordB]))];
  return {
    timestamp: new Date().toISOString(),
    config: {
      modelA: config.modelA,
      modelB: config.modelB,
      maxRounds: config.maxRounds,
      temperature: config.temperature,
      startingWords: [config.wordA, config.wordB],
    },
    rounds,
    converged,
    totalRounds,
    convergedWord: converged ? rounds[rounds.length - 1].wordA : null,
    uniqueWords: allWords,
  };
}

// --- Output ---

function printSummary(result: GameResult) {
  console.log("\n" + "─".repeat(50));
  console.log("📊 Game Summary");
  console.log("─".repeat(50));

  if (result.converged) {
    console.log(
      `\n  ✅ Converged on "${result.convergedWord}" in ${result.totalRounds} round${result.totalRounds === 1 ? "" : "s"}`
    );
  } else {
    console.log(
      `\n  ❌ Failed to converge after ${result.totalRounds} rounds`
    );
  }

  console.log("\n  Path:");
  for (const round of result.rounds) {
    const marker = round.converged ? " ✅" : "";
    console.log(
      `    ${round.number.toString().padStart(2)}. ${round.wordA}  ↔  ${round.wordB}${marker}`
    );
  }

  console.log(`\n  Unique words: ${result.uniqueWords.length}`);
  console.log(`  All words: ${result.uniqueWords.join(", ")}`);
  console.log();
}

async function saveResult(result: GameResult): Promise<string> {
  if (!existsSync(RESULTS_DIR)) {
    await mkdir(RESULTS_DIR, { recursive: true });
  }

  // filename: timestamp-modelslug-wordA-wordB.json
  const ts = result.timestamp.replace(/[:.]/g, "-").slice(0, 19);
  const modelSlug = (result.config.modelA === result.config.modelB
    ? result.config.modelA
    : `${result.config.modelA}_vs_${result.config.modelB}`
  ).replace(/[/\\:]/g, "_");
  const filename = `${ts}-${modelSlug}-${result.config.startingWords[0]}-${result.config.startingWords[1]}.json`;
  const filepath = `${RESULTS_DIR}/${filename}`;

  await writeFile(filepath, JSON.stringify(result, null, 2) + "\n");
  console.log(`  💾 Saved to ${filepath}`);
  return filepath;
}

// --- CLI ---

function parseArgs(): GameConfig {
  const args = process.argv.slice(2);
  let model: string | undefined;
  let modelA: string | undefined;
  let modelB: string | undefined;
  let maxRounds = DEFAULT_MAX_ROUNDS;
  let temperature = DEFAULT_TEMPERATURE;
  let wordA: string | undefined;
  let wordB: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === "--model-a" && args[i + 1]) {
      modelA = args[++i];
    } else if (args[i] === "--model-b" && args[i + 1]) {
      modelB = args[++i];
    } else if (args[i] === "--max-rounds" && args[i + 1]) {
      maxRounds = parseInt(args[++i], 10);
    } else if (args[i] === "--temperature" && args[i + 1]) {
      temperature = parseFloat(args[++i]);
    } else if (args[i] === "--word-a" && args[i + 1]) {
      wordA = args[++i].toLowerCase();
    } else if (args[i] === "--word-b" && args[i + 1]) {
      wordB = args[++i].toLowerCase();
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: bun run index.ts [options]

Options:
  --model <model>        OpenRouter model for both players (default: ${DEFAULT_MODEL})
  --model-a <model>      Model for Player A (overrides --model)
  --model-b <model>      Model for Player B (overrides --model)
  --word-a <word>        Starting word for Player A (default: random from dictionary)
  --word-b <word>        Starting word for Player B (default: random from dictionary)
  --max-rounds <n>       Maximum rounds before giving up (default: ${DEFAULT_MAX_ROUNDS})
  --temperature <n>      Sampling temperature 0.0-2.0 (default: ${DEFAULT_TEMPERATURE})
  --help, -h             Show this help

Examples:
  bun run index.ts
  bun run index.ts --model google/gemini-2.0-flash-001
  bun run index.ts --model-a openai/gpt-4o --model-b anthropic/claude-3.5-sonnet
  bun run index.ts --word-a mountain --word-b ocean
  bun run index.ts --max-rounds 30
`);
      process.exit(0);
    }
  }

  const resolvedModelA = modelA || model || DEFAULT_MODEL;
  const resolvedModelB = modelB || model || DEFAULT_MODEL;
  const resolvedWordA = wordA || pickRandomWord();
  const resolvedWordB = wordB || pickRandomWord(resolvedWordA);

  return {
    modelA: resolvedModelA,
    modelB: resolvedModelB,
    maxRounds,
    temperature,
    wordA: resolvedWordA,
    wordB: resolvedWordB,
  };
}

// --- Main ---

const config = parseArgs();
const result = await playGame(config);
printSummary(result);
await saveResult(result);
