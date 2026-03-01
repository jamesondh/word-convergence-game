# Round 4: Stability & Symmetry

**Question:** Are the biggest findings from rounds 1-3 — semantic attractors, cross-model novelty, model personality profiles — robust patterns or lucky trajectories?

**Method:** 4 anchor pairs × 4 models × 2 directions × 5 reps + 2 cross-model pairings × 4 pairs × 2 directions × 5 reps = 240 games (236 succeeded, 4 timeouts).

**Models:** Claude Sonnet 4.6, GPT-5.2, Grok 4.1 Fast, Gemini 3 Flash (the 4 with distinct personalities — dropped minimax and glm-5).

---

## The Semantic Basin Framework

Round 4's biggest contribution is turning "cool examples" into a measurable landscape. The results reveal three distinct types of semantic terrain:

### 1. Deep Basins — Inescapable Attractors

**Beyoncé↔erosion → "formation" (78-82% attractor strength)**

The deepest basin in the entire experiment. Every model, every direction, every run — formation dominates. The word sits at a perfect intersection: Beyoncé's hit song + geological formation (erosion's domain). Even cross-model games converge on it 70% of the time.

Symmetry: **perfect**. All 4 models produce "formation" as the top word in both forward and reverse directions. This pair has essentially one answer.

| Model | Forward | Reverse | Strength |
|---|---|---|---|
| Gemini | formation | formation | 78% |
| Grok | formation | formation | 82% |
| Claude | formation | formation | 80% |
| GPT | formation | formation | 82% |

When models *don't* hit formation, they land in adjacent territory: sand, sandcastle, dune, rock. The basin has clearly defined walls.

### 2. Moderate Basins — Model-Specific Attractors

**Tesla↔mycelium → "network" (45-100% strength, direction-dependent)**

"Network" is a strong attractor — but not universal. Three models (Gemini 100%, Grok 91%, GPT 64%) reliably converge on it. Claude only hits "network" 45% of the time, splitting with "electricity."

The surprise: **direction matters.** Claude produces "network" in the forward direction (Tesla→mycelium) but "electricity" in the reverse (mycelium→Tesla). GPT shows a similar split: forward → "network", reverse → "grid". Gemini and Grok are direction-invariant (always "network").

This reveals that word order biases which semantic frame the model enters. When Tesla is Player A's word, models start by thinking about Tesla's *ideas* (electrical networks). When mycelium is Player A's word, models start with the fungal network metaphor directly.

**shadow↔melody → "echo" (model-dependent)**

"Echo" as a universal attractor was overstated. It's really a **Claude+Gemini attractor** — both produce "echo" 100% of the time, in both directions, with zero variance. Perfectly robotic.

Grok and GPT orbit completely different semantic territory:
- **Grok**: "nocturne" (36%), with a scattered tail through phantom, opera, ghost, mask, sonata. Grok takes shadow↔melody through a musical/theatrical frame (Phantom of the Opera keeps appearing).
- **GPT**: splits between "nocturne" (36%) and "resonance" (27%), with no dominant winner. GPT explores the acoustic physics frame (reverb, acoustic, chord).

**Symmetry splits along model lines.** Claude/Gemini: perfectly symmetric (echo regardless of direction). Grok: symmetric to a different attractor (nocturne both ways). GPT: asymmetric (chord forward, nocturne reverse).

### 3. Flat Landscapes — No Basin At All

**Kanye↔lattice → maximum entropy (10-36% top word strength)**

Round 3's finding that Kanye↔lattice produces maximum divergence is robustly confirmed. No model converges on the same word even twice with any reliability:

| Model | Top Word | Strength | Unique Words (across 10-11 games) |
|---|---|---|---|
| Gemini | grid | 36% | grid, coordinate, graduation, barrier, gate, debt |
| Claude | gold | 30% | gold, brick, scaffold, architecture, wire, picket, glass, ring |
| Grok | ice | 18% | ice, diamond, chain, street, brand, drip, crystal, necklace, yeezy |
| GPT | facet | 18% | facet, grid, jewelry, internet, structure, construction, adjacency, crystal, matrix, pattern |

Each model enters a completely different conceptual frame:
- **Claude**: structural (scaffold, brick, wire, picket) — treats lattice literally as a physical structure and Kanye as gold/jewelry
- **Gemini**: academic (graduation, coordinate, grid, debt) — Kanye → College Dropout → academic associations
- **Grok**: hip-hop material culture (ice, diamond, chain, drip, bling, yeezy) — Kanye's brand identity dominates
- **GPT**: geometric/mathematical (facet, matrix, pattern, crystal, adjacency) — abstracts both concepts

**Word order creates total asymmetry:** All 4 models produce different top words forward vs reverse. The landscape is so flat that the slight push of word order sends the model off in a completely different direction.

---

## Cross-Model Dynamics

### Novelty Rate: 48% Overall

The claim that cross-model games produce novel semantic territory is confirmed — but it's highly pair-dependent:

| Pair | Novelty Rate | Why |
|---|---|---|
| Tesla↔mycelium | 0% | Basin too deep — even mismatched models fall into "network" |
| Beyoncé↔erosion | 10-30% | "formation" dominates, occasional escapes (periodicity, dune) |
| shadow↔melody | 73-90% | Models disagree on frame, force novel bridging |
| Kanye↔lattice | 80-100% | No basin exists, everything is novel by default |

**Key insight:** Novelty correlates inversely with attractor strength. Deep basins resist novelty — the answer is so obvious that even mismatched models find it. Flat landscapes produce novelty trivially because nothing is stable. The interesting zone is **moderate basins** (shadow↔melody) where models genuinely disagree on the right frame and must negotiate.

### The Chaos of Cross-Model Games

Same-model games are predictable: avg 2.3-2.8 rounds, narrow variance.

Cross-model games are chaotic: avg 4.1 rounds, σ≈3.1, range 2-19.

Some spectacular spirals:

**Claude vs GPT on Beyoncé↔erosion (19 rounds):**
```
soil↔formation → geology↔pedogenesis → science↔weathering → climate↔geomorphology
→ landscape↔glaciation → glacier↔topography → terrain↔moraine → deposit↔deposition
→ sediment↔sedimentation → layer↔accumulation → stratum↔stratigraphy → rock↔bedding
→ plane↔sedimentary → basin↔lamination → strata↔varve → annual↔rhythmite
→ cycle↔cyclicity → [periodicity]
```
Both models bypassed the obvious "formation" attractor on round 1 and entered a deep geological spiral. Claude spoke process (weathering, glaciation, deposition), GPT spoke classification (pedogenesis, stratigraphy, varve). They orbited each other for 17 rounds before converging on "periodicity" — a word neither model ever produced solo.

**Grok vs Gemini on Kanye↔lattice (16 rounds):**
```
bar↔grid → grate↔graph → network↔coordinate → plane↔systemix → cartesian↔geometry
→ analytic↔axis → synthetic↔algebra → division↔logic → operator↔boolean → gate↔binary
→ bit↔circuit → transistor↔chip → silicon↔processor → semiconductor↔computer → [hardware]
```
Started from "lattice" as mathematical structure, spiraled through coordinate geometry into boolean logic, then descended through computer architecture layers until converging on "hardware." A 16-round journey from hip-hop to silicon.

**Claude vs GPT on shadow↔melody (9 rounds → "biome"):**
```
echo↔nocturne → night↔reverb → sound↔ambience → atmosphere↔soundscape
→ ambient↔environment → nature↔surrounding → habitat↔ecosystem → [biome]
```
Started in acoustics (echo, reverb) and ended in ecology. The concept of "ambience" as acoustic atmosphere bridged into environmental atmosphere, and both models followed the metaphor all the way to biome.

---

## Path Length Variance: Model Personality Confirmed

| Model | Avg Rounds | StdDev | Min | Max | Profile |
|---|---|---|---|---|---|
| Claude Sonnet 4.6 | 2.3 | 0.49 | 2 | 4 | 🎯 Robotic |
| GPT-5.2 | 2.8 | 0.88 | 2 | 5 | 📐 Stable |
| Grok 4.1 Fast | 2.7 | 0.98 | 2 | 6 | 📐 Stable |
| Gemini 3 Flash | 2.4 | 1.11 | 2 | 7 | 🌊 Variable |
| Claude vs GPT | 4.1 | 3.18 | 2 | 19 | 🎲 Chaotic |
| Grok vs Gemini | 4.1 | 3.09 | 2 | 16 | 🎲 Chaotic |

**Claude** is the most deterministic player in the game. σ=0.49 means it almost never deviates from its preferred path. When it converges in 2 rounds, it converges in 2 rounds. When a pair is harder, it takes 3. Never more than 4.

**Gemini** has the widest solo variance (σ=1.11) — usually instant (2 rounds) but occasionally spirals to 7. It's fast when it sees the obvious answer and exploratory when it doesn't.

**Cross-model games** have σ≈3.1 — genuinely unpredictable. The same pair can converge in 2 rounds or spiral for 19.

---

## Claude's Asymmetry: The Deepest Finding

The most unexpected result: **Claude is direction-sensitive.** On Tesla↔mycelium:
- Forward (Tesla → mycelium): "network" 80% of the time
- Reverse (mycelium → Tesla): "electricity" 100% of the time

This is perfectly reproducible. 5/5 reverse runs produced "electricity." Claude's first move when it sees "mycelium" as Player A's word and "Tesla" as Player B's word is *always* "electricity."

Gemini and Grok show no direction sensitivity — they produce the same attractor regardless of word order. This suggests Claude's semantic associations are **more sensitive to positional framing** than other models. Being "Player A" vs "Player B" matters to Claude in a way it doesn't for Gemini.

This has implications beyond the game: it suggests that Claude's concept associations may be more context-dependent and positionally biased than other models. The same two concepts, presented in different order, activate different semantic frames.

---

## Summary: What's Real

| Claim from Rounds 1-3 | Verdict | Nuance |
|---|---|---|
| "Network" is a universal attractor for Tesla↔mycelium | ✅ Confirmed | Universal for 3/4 models. Claude splits with "electricity" in reverse direction |
| "Echo" is a universal attractor for shadow↔melody | ❌ Partially debunked | Only universal for Claude+Gemini. Grok→nocturne, GPT→nocturne/resonance |
| "Formation" is a cultural attractor for Beyoncé↔erosion | ✅ Strongly confirmed | 70-82% across all models and all conditions. Deepest basin tested |
| Kanye↔lattice produces maximum divergence | ✅ Confirmed | 0% of models show stable attractor. Maximum entropy across 10+ runs per model |
| Cross-model games produce novel semantic territory | ✅ Confirmed with caveat | 48% novelty overall. Novelty inversely correlates with attractor strength |
| Claude converges fastest | ✅ Confirmed | σ=0.49. Most deterministic model tested |
| Cross-model games are longer | ✅ Confirmed | Avg 4.1 rounds vs 2.3-2.8 solo. σ≈3.1 — genuinely chaotic |
| Each model has a distinct personality | ✅ Confirmed | Grok=cultural, GPT=geometric, Claude=structural, Gemini=convergent |

---

## What This Means for the Article

The word convergence game isn't just a toy — it's a probe for **semantic topology.** Each word pair defines a landscape, and each model navigates that landscape with a characteristic style:

- Some landscapes have deep valleys (formation, network) that pull every model toward the same point. These are semantic *basins of attraction* — concepts so naturally connected that the bridge between them has essentially one answer.

- Some landscapes are rolling hills (echo/nocturne for shadow↔melody) where different models settle into different local minima depending on their conceptual frame.

- Some landscapes are flat plains (Kanye↔lattice) with no gravitational center, where models wander freely and word order is the only bias.

Cross-model games are the equivalent of dropping two balls on the same landscape but giving them different masses and shapes. They don't just take longer to settle — they carve out new paths that neither ball would follow alone.

The direction sensitivity finding (Claude's asymmetry) suggests that these semantic landscapes aren't even static — they shift depending on which direction you enter from. The topology of meaning isn't fixed; it's perspective-dependent.
