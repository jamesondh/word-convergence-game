# Round 3: People × Concepts + Cross-Model Matchups

**Date:** 2026-03-01
**Models:** minimax-m2.5, glm-5, gemini-3-flash, grok-4.1-fast, claude-sonnet-4.6, gpt-5.2

## Experiment A: People × Concepts

**Pairs:** Elon Musk↔liturgy, Beyoncé↔erosion, Nikola Tesla↔mycelium, Cleopatra↔fractal, Kanye West↔lattice

### Results Table

| Model | Musk↔liturgy | Beyoncé↔erosion | Tesla↔mycelium | Cleopatra↔fractal | Kanye↔lattice | Avg |
|---|---|---|---|---|---|---|
| minimax-m2.5 | 5r → custom | 4r → momentum | 4r → transmission | 2r → pyramid | 3r → weave | 3.6 |
| glm-5 | 3r → religion | 3r → evolution | 2r → network | 2r → pyramid | 3r → gold | 2.6 |
| gemini-3-flash | 5r → mars | 2r → formation | 2r → network | 4r → giza | 7r → debt | 4.0 |
| grok-4.1-fast | 3r → ritual | 2r → formation | 2r → network | 3r → geometry | 4r → crystal | 2.8 |
| claude-sonnet-4.6 | 2r → church | 3r → band | 2r → network | 2r → pyramid | 3r → scaffold | 2.4 |
| gpt-5.2 | 3r → sect | 2r → formation | 2r → network | 2r → pyramid | 3r → facet | 2.4 |

### Key Findings

#### Claude's 100% instant-convergence streak is broken

After 10 straight games at exactly 2 rounds (rounds 1-2), Claude finally took longer on two people pairs:
- Beyoncé↔erosion: `formation↔rock → [band]` (3 rounds)
- Kanye West↔lattice: `structure↔framework → [scaffold]` (3 rounds)

Famous people introduce enough semantic ambiguity to disrupt Claude's instant-convergence strategy. The person has so many possible associations that even Claude's two instances can't agree on the same bridge word.

#### "Network" is the strongest attractor we've found

Nikola Tesla↔mycelium: **ALL 6 MODELS** converged on "network", and 5 of 6 did it instantly (2 rounds). Only minimax took longer (network↔energy → grid↔power → transmission). The Tesla electrical network ↔ mycelium fungal network bridge is so obvious it's nearly universal.

#### "Pyramid" is almost as strong

Cleopatra↔fractal: 4 out of 6 models converged on "pyramid" in 2 rounds (Sierpinski triangle + Egyptian pyramids). Grok went pyramid→pattern→geometry. Gemini took 4 rounds through nile→sphinx→egypt→giza.

#### "Formation" — Beyoncé's cultural footprint in LLM semantic space

Beyoncé↔erosion: 4 out of 6 models converged on "formation" — her hit song + geological formation. Gemini, Grok, GPT, and (surprisingly not Claude) all found it instantly. Claude went formation↔rock→band, and minimax went force↔time→impulse↔motion→momentum.

#### Kanye West↔lattice is the most divergent pair

Every model found a completely different path:
- minimax: beat↔fabric → **weave** (textile)
- glm-5: bar↔diamond → **gold** (material wealth)
- gemini: graduation↔yeezy → college↔adidas → university↔scholarship → academic↔tuition → loan↔bursar → **debt** (7 rounds! longest game across all 3 rounds!)
- grok: diamond↔honeycomb → cell↔structure → **crystal** (crystallography)
- claude: structure↔framework → **scaffold** (construction)
- gpt-5.2: architecture↔diamond → **facet** (gem cutting)

No strong attractor. "Diamond" appeared as an intermediate word in 3 different models' paths (glm-5, grok, gpt-5.2) — likely from Kanye's "Diamonds from Sierra Leone" — but they all went different directions from there.

Gemini's 7-round path is remarkable: it got fixated on Kanye's "College Dropout" album and spiraled into the academic finance semantic neighborhood. This is the kind of cultural-reference chain that only works because LLMs encode pop culture associations.

---

## Experiment B: Cross-Model Matchups

Pitting models against each other on pairs where we have solo data for direct comparison.

### Claude (A) vs GPT (B)

| Pair | Claude solo | GPT solo | Cross-model |
|---|---|---|---|
| shadow↔melody | 2r → echo | 4r → chord | **8r → broadcast** |
| skull↔garden | 2r → bone | 5r → inscription | 3r → grave |
| vertigo↔mycelium | 2r → spiral | 3r → alkaloid | 3r → maze |

### Grok (A) vs Gemini (B)

| Pair | Grok solo | Gemini solo | Cross-model |
|---|---|---|---|
| hammer↔butterfly | 3r → pinfish | 2r → thorax | **5r → museum** |
| palimpsest↔thunder | 5r → rhythm | 3r → vibration | 4r → resonance |
| nostalgia↔isotope | 3r → carbon | 3r → radiation | 3r → decay |

### Key Findings

#### THE BIG ONE: Cross-model games take longer and produce novel convergence words

| Metric | Same-model avg | Cross-model avg |
|---|---|---|
| Rounds to convergence | ~2.8 | ~4.3 |
| Novel convergence word (not found by either model solo) | — | 4 out of 6 games |

In 4 out of 6 cross-model games, the models converged on a word that **neither model found in its solo game**: broadcast, maze, museum, resonance. Mixing models doesn't just slow convergence — it creates entirely new semantic territory.

#### Claude vs GPT on shadow↔melody: 8 rounds — the longest game yet

`echo↔nocturne → night↔resonance → frequency↔silence → wave↔noise → sound↔signal → transmission↔audio → [broadcast]`

Claude alone converges on "echo" in 2 rounds. GPT alone gets "chord" in 4. Together? 8 rounds of mutual incomprehension before finding common ground at "broadcast."

What happened: Claude's Player A keeps reaching for clean, precise words (echo, night, frequency, wave, sound, transmission) while GPT's Player B keeps reaching for richer, more connotative ones (nocturne, resonance, silence, noise, signal, audio). They're speaking adjacent languages. Claude is physics, GPT is aesthetics. They finally meet where physics and aesthetics overlap: broadcast.

#### Grok vs Gemini on hammer↔butterfly: building something new together

`pin↔thorax → insect↔specimen → collection↔entomology → [museum]`

Grok said "pin" (butterfly pin), Gemini said "thorax" (insect body part). From there, they jointly built toward "butterfly collection" territory — insect, specimen, collection, entomology — and landed on "museum." Neither model found anything like this solo (Grok went to "pinfish," Gemini went to "thorax" instantly).

The cross-model game produced a more interesting and coherent narrative than either model alone.

#### Cross-model convergence words split the difference

In the cases where the cross-model game converged on something related to the solo results:
- skull↔garden: Claude's "bone" + GPT's "inscription" → cross converged on "grave" (which GPT had passed through at round 4 solo)
- palimpsest↔thunder: Grok's "rhythm" + Gemini's "vibration" → cross converged on "resonance" (adjacent to both)

The cross-model game finds the midpoint between two models' semantic preferences.

---

## Running Stats Across All 3 Rounds

| Model | Total Games | Avg Rounds | 2-round % | Total Unique Vocab |
|---|---|---|---|---|
| claude-sonnet-4.6 | 15 | 2.1 | 87% | ~42 |
| gemini-3-flash | 15 | 2.9 | 40% | ~55 |
| gpt-5.2 | 15 | 2.9 | 33% | ~70 |
| grok-4.1-fast | 15 | 2.9 | 40% | ~62 |
| glm-5 | 15 | 2.9 | 33% | ~55 |
| minimax-m2.5 | 15 | 3.2 | 33% | ~62 |

Note: These are approximations — exact counts in the JSON data.
