# Round 5: Temperature, Prediction & Direction

**Questions:**
1. Are semantic basins real structure or high-temperature noise?
2. Can the basin framework predict behavior on unseen pairs?
3. Does Player A vs Player B assignment matter in cross-model games?

**Method:** 240 games across three experiments. 4 models (Claude, GPT, Grok, Gemini).

---

## Experiment A: Temperature Comparison (0.3 vs 1.0)

### The Big Finding: Basins Are Structure, Not Noise

Lowering temperature from 1.0 to 0.3 barely changes basin depth. The attractors persist because they reflect real structure in the models' concept associations, not random walks that happen to land in the same place.

| Pair | Model | T=1.0 | T=0.3 | Change |
|---|---|---|---|---|
| Beyoncé↔erosion | Gemini | 78% formation | 100% formation | +22% |
| Beyoncé↔erosion | Claude | 80% formation | 100% formation | +20% |
| Beyoncé↔erosion | Grok | 82% formation | 83% formation | +1% |
| Tesla↔mycelium | Gemini | 100% network | 100% network | 0% |
| Tesla↔mycelium | Grok | 91% network | 100% network | +9% |
| shadow↔melody | Claude | 100% echo | 100% echo | 0% |
| shadow↔melody | Gemini | 100% echo | 100% echo | 0% |
| shadow↔melody | Grok | 36% nocturne | 50% nocturne | +14% |

**Deep basins get deeper.** Gemini on Beyoncé↔erosion: 78% → 100%. Claude: 80% → 100%. Remove randomness, and the basin's pull becomes absolute.

**Moderate basins sharpen slightly.** Grok's nocturne attractor for shadow↔melody: 36% → 50%. Lower temperature focuses the beam but doesn't change the target.

**Flat landscapes remain flat.** Kanye↔lattice at T=0.3: all models increase their top-word percentage by 14-20%, but the landscape is still chaotic — no word exceeds 50%, and different models still diverge completely.

| Kanye↔lattice | T=1.0 | T=0.3 |
|---|---|---|
| Gemini | 36% grid | 50% grid |
| Grok | 18% ice | 33% diamond |
| Claude | 30% gold | 50% gold |
| GPT | 18% facet | 33% argyle |

Even removing 70% of the randomness can't create a basin where none exists.

### The GPT Anomaly

GPT is the only model that gets *less* consistent at low temperature on some pairs:

- Beyoncé↔erosion: 82% → 50% formation
- Tesla↔mycelium: 64% → 50% network

This is counterintuitive — lower temperature should increase consistency. The likely explanation: GPT has multiple competing attractors of similar strength, and lower temperature makes it more committed to whichever path it enters first, rather than defaulting to the "safe" choice. At T=1.0, randomness acts like a tiebreaker that tends to favor the most common word. At T=0.3, GPT picks a path and sticks to it, even if it's the less common one.

This makes GPT the most "opinionated" model at low temperature — it doesn't consensus-seek, it picks a frame and commits.

### What This Means

Temperature is a focusing parameter, not a creative one. It sharpens existing topology without creating new features. Basins are properties of the model's knowledge graph, not artifacts of sampling randomness.

---

## Experiment B: Prediction Test

We picked 3 new pairs with predicted basin types to test whether the framework can predict, not just describe.

### Einstein↔ocean — Predicted: DEEP, Actual: MODERATE ❌

Expected "wave" or "energy" as a universal attractor. Reality:

| Model | Top Word | Strength | Notes |
|---|---|---|---|
| Claude | wave | 100% | 6/6 instant convergence. Robotically predictable. |
| Grok | wave | 50% | Also hits gravity, curvature, force |
| GPT | wave | 33% | Splits between wave, gravity, spacetime, curvature |
| Gemini | physics | 33% | Goes meta: relativity, physics, relative, family(!). Never hits "wave" |

"Wave" is strong but not universal. Gemini doesn't even converge on it — it goes to "relativity" and "physics" instead. Claude treats it as obvious (100%), GPT treats it as one option among several.

**Why the prediction failed:** "wave" connects Einstein (wave-particle duality, gravitational waves) and ocean (waves) — but it's almost too literal. More sophisticated models find deeper connections (spacetime, gravity) that are equally valid but don't converge. The pair has multiple legitimate bridges at different levels of abstraction.

### Shakespeare↔algorithm — Predicted: MODERATE, Actual: MODERATE ✅

Multiple competing frames, exactly as predicted:

| Model | Top Word | Strength | Frame |
|---|---|---|---|
| Gemini | sonnet | 100% | Literary form meets computational structure |
| Claude | code | 83% | Double meaning: genetic code, programming code, cipher code |
| Grok | code | 33% | Same "code" frame but more exploratory (script, story, programming) |
| GPT | language | 33% | Linguistics: language, syntax, frequency, cryptography |

Four models, three different frames:
- **Gemini → sonnet** (literary structure that is also a model name). 5/5 games, perfectly robotic. The word "sonnet" bridges Shakespeare (wrote them) and algorithm (formal structure, poetic pattern) with machine precision.
- **Claude → code** (double meaning: Shakespeare's codes and programming). 5/6 games.
- **GPT → language** (the medium both share). More abstract, treating the connection as linguistic rather than structural.
- **Grok → code/script** (practical: scripts are both plays and programs). Most scattered.

Classic moderate basin — the concept space has multiple valleys of similar depth, and each model settles into a different one.

### Beyoncé↔mycelium — Predicted: FLAT, Actual: MODERATE ❌

We thought there was no obvious bridge. We were wrong.

| Model | Top Word | Strength | Frame |
|---|---|---|---|
| Grok | hive | 67% | Bees → hive mind → fungal networks |
| Claude | network | 50% | Social network meets fungal network |
| Gemini | network | 50% | Same network frame |
| GPT | hive | 33% | Same bee/hive frame, more scattered |

Two competing attractors: **"network"** (both Beyoncé and mycelium connect through networks — social media, fungal) and **"hive"** (Beyoncé → Beyhive fandom → beehive → mycelium as underground network). Plus "queen" appears in both (queen bee, queen B).

**Why the prediction failed:** We underestimated the richness of metaphorical connections. Beyoncé's cultural footprint includes network/community metaphors (the Hive, her fan network, Formation as collective action). Mycelium's primary cultural metaphor IS "the network." The intersection was hiding in plain sight.

### Prediction Scorecard

| Pair | Predicted | Actual | Correct? |
|---|---|---|---|
| Einstein↔ocean | DEEP | MODERATE | ❌ |
| Shakespeare↔algorithm | MODERATE | MODERATE | ✅ |
| Beyoncé↔mycelium | FLAT | MODERATE | ❌ |

**1/3.** The framework describes well but predicts poorly. Two failure modes:
1. **Overestimating depth** (Einstein↔ocean): A "too obvious" bridge (wave) is actually moderate because sophisticated models find alternatives.
2. **Underestimating connections** (Beyoncé↔mycelium): Humans have poor intuition for the richness of metaphorical intersection. We see "pop star + fungus = nothing" but models see overlapping network/community/queen metaphors.

This is itself a finding for the article: **human intuition about semantic distance is systematically wrong in predictable ways.** We overweight surface similarity and underweight metaphorical structure.

---

## Experiment C: Cross-Model Direction Test

### Player A Advantage Is Real

When two models play, which one is Player A (the one whose starting word is listed first, who "leads" the conceptual framing) matters:

| Pairing | Faster as A | Avg rounds (leading) | Avg rounds (following) | Δ |
|---|---|---|---|---|
| Claude ↔ GPT | Claude | 4.1 | 5.0 | +22% slower when GPT leads |
| Grok ↔ Gemini | Grok | 3.9 | 4.8 | +23% slower when Gemini leads |
| Claude ↔ Grok | Grok | 3.8 (Claude leads) | 3.0 (Grok leads) | Grok faster in both positions |

**Pattern: the more decisive model converges faster as Player A.** Claude and Grok (quick, confident first moves) benefit from leading. GPT and Gemini (more exploratory) are slower leads.

The exception: Grok beats Claude from *either* position. Grok's lateral thinking style somehow negotiates faster than Claude's precision in cross-model play.

### Deep Basins Erase Direction Effects

On Beyoncé↔erosion, model ordering doesn't matter — "formation" wins regardless:
- Claude→Grok: 2.0 avg, 100% formation
- Grok→Claude: 2.0 avg, 100% formation

On shadow↔melody, direction effects are dramatic:
- Claude→GPT: 5.1 avg, scattered (echo, dream, silence, biome, broadcast)
- GPT→Claude: **8.7 avg**, completely scattered (surge, whisper, signal)

When GPT leads on a pair where it doesn't share Claude's attractor (echo), the result is chaotic. Claude sees "shadow↔melody" and immediately thinks "echo." GPT sees the same and thinks "nocturne." Neither meets the other halfway. When Claude leads, it steers closer to its attractor and GPT eventually finds a bridge. When GPT leads, it steers into territory Claude finds alien, and both spiral.

---

## Summary: What Round 5 Adds

### For the article's credibility:
**Basins are real.** Temperature doesn't create them. Reducing randomness by 70% sharpens existing basins but can't manufacture new ones. This is the strongest evidence that we're measuring genuine structure in model knowledge, not sampling noise.

### For the article's narrative:
**Prediction is hard.** The framework describes beautifully but predicts 1/3. The failure modes are interesting: humans overestimate literal connections and underestimate metaphorical ones. Models find bridges in conceptual structure that feel arbitrary to us but are actually systematic.

### For new findings:
1. **The GPT anomaly** — uniquely less consistent at low temperature, suggesting competing attractors of equal strength.
2. **Gemini on Shakespeare↔algorithm = "sonnet" 100%** — a perfect model-specific attractor. The word "sonnet" is a literary form (Shakespeare) that's also a formal computational pattern (algorithm for constructing verse) AND a model name in Gemini's competitive landscape.
3. **Beyoncé↔mycelium = "hive/network"** — a hidden moderate basin we didn't predict, revealing that semantic distance is non-obvious.
4. **Player A advantage** — decisive models (Claude, Grok) converge faster when they lead. Deep basins erase the advantage entirely.
5. **Grok is the best negotiator** — fastest cross-model convergence from either position, possibly because its lateral style finds unexpected bridges that other models can accept.
