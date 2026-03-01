#!/usr/bin/env bun

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in environment or .env file");
  process.exit(1);
}

const DEFAULT_MODEL = "minimax/minimax-m2.5";
const DEFAULT_MAX_ROUNDS = 20;
const MAX_RETRIES = 3;

interface GameConfig {
  model: string;
  maxRounds: number;
}

interface Round {
  number: number;
  wordA: string;
  wordB: string;
  converged: boolean;
}

async function chat(
  model: string,
  messages: { role: "system" | "user"; content: string }[]
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
        temperature: 1.0,
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

function singularize(word: string): string {
  // Very basic — just handles common plural forms to avoid near-miss frustration
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

async function playGame(config: GameConfig): Promise<{
  rounds: Round[];
  converged: boolean;
  totalRounds: number;
}> {
  const rounds: Round[] = [];

  console.log("\n🎮 Starting Convergence Game");
  console.log(`   Model: ${config.model}`);
  console.log(`   Max rounds: ${config.maxRounds}`);
  console.log("─".repeat(44));

  // Round 1: both pick a random word (stateless, no history needed)
  const initSystem = `You are playing a word game. Say a single random word. Pick something unexpected — not a typical or cliché choice. Just the word itself, nothing else. No explanation, no quotes, no punctuation.`;

  const [rawA, rawB] = await Promise.all([
    chat(config.model, [
      { role: "system", content: initSystem },
      { role: "user", content: "Say one random word." },
    ]),
    chat(config.model, [
      { role: "system", content: initSystem },
      { role: "user", content: "Say one random word." },
    ]),
  ]);

  const wordA = extractWord(rawA);
  const wordB = extractWord(rawB);
  const converged = wordA === wordB;
  rounds.push({ number: 1, wordA, wordB, converged });

  console.log(
    `\n  Round  1:  ${wordA}  ↔  ${wordB}${converged ? "  ✅" : ""}`
  );

  if (converged) {
    return { rounds, converged: true, totalRounds: 1 };
  }

  // Convergence rounds — each call is stateless, all context in the prompt
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
      chat(config.model, [
        { role: "system", content: convergeSystem },
        { role: "user", content: promptA },
      ]),
      chat(config.model, [
        { role: "system", content: convergeSystem },
        { role: "user", content: promptB },
      ]),
    ]);

    const wordA = extractWord(rawA);
    const wordB = extractWord(rawB);
    const converged = wordA === wordB;
    rounds.push({ number: round, wordA, wordB, converged });

    console.log(
      `  Round ${round.toString().padStart(2)}:  ${wordA}  ↔  ${wordB}${converged ? "  ✅" : ""}`
    );

    if (converged) {
      return { rounds, converged: true, totalRounds: round };
    }
  }

  return { rounds, converged: false, totalRounds: config.maxRounds };
}

function printSummary(result: {
  rounds: Round[];
  converged: boolean;
  totalRounds: number;
}) {
  console.log("\n" + "─".repeat(44));
  console.log("📊 Game Summary");
  console.log("─".repeat(44));

  if (result.converged) {
    const finalWord = result.rounds[result.rounds.length - 1].wordA;
    console.log(
      `\n  ✅ Converged on "${finalWord}" in ${result.totalRounds} round${result.totalRounds === 1 ? "" : "s"}`
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

  const allWords = new Set(result.rounds.flatMap((r) => [r.wordA, r.wordB]));
  console.log(`\n  Unique words: ${allWords.size}`);
  console.log(`  All words: ${[...allWords].join(", ")}`);
  console.log();
}

// --- CLI ---
function parseArgs(): GameConfig {
  const args = process.argv.slice(2);
  let model = DEFAULT_MODEL;
  let maxRounds = DEFAULT_MAX_ROUNDS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === "--max-rounds" && args[i + 1]) {
      maxRounds = parseInt(args[++i], 10);
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: bun run index.ts [options]

Options:
  --model <model>        OpenRouter model ID (default: ${DEFAULT_MODEL})
  --max-rounds <n>       Maximum rounds before giving up (default: ${DEFAULT_MAX_ROUNDS})
  --help, -h             Show this help

Examples:
  bun run index.ts
  bun run index.ts --model google/gemini-2.0-flash-001
  bun run index.ts --max-rounds 30
`);
      process.exit(0);
    }
  }

  return { model, maxRounds };
}

const config = parseArgs();
const result = await playGame(config);
printSummary(result);
