# Round 2: Hard Pairs (Abstract / Rare Words)

**Date:** 2026-03-01
**Models:** minimax-m2.5, glm-5, gemini-3-flash, grok-4.1-fast, claude-sonnet-4.6, gpt-5.2 (kimi dropped — too slow)
**Pairs:** palimpsest↔thunder, nostalgia↔isotope, liturgy↔erosion, vertigo↔mycelium, paradox↔amber

## Results Table

| Model | palimpsest↔thunder | nostalgia↔isotope | liturgy↔erosion | vertigo↔mycelium | paradox↔amber | Avg |
|---|---|---|---|---|---|---|
| minimax-m2.5 | 2r → echo | 5r → radioisotope | 3r → flow | 2r → spore | 2r → fossil | 2.8 |
| glm-5 | 2r → echo | 2r → decay | 3r → heritage | 5r → wrench | 2r → time | 2.8 |
| gemini-3-flash | 3r → vibration | 3r → radiation | 2r → sedimentation | 2r → underground | 3r → dinosaur | 2.6 |
| grok-4.1-fast | 5r → rhythm | 3r → carbon | 2r → gradual | 2r → labyrinth | 3r → charge | 3.0 |
| claude-sonnet-4.6 | 2r → storm | 2r → carbon | 2r → ritual | 2r → spiral | 2r → fossil | 2.0 |
| gpt-5.2 | 2r → echo | 4r → decay | 3r → masonry | 3r → alkaloid | 2r → time | 2.8 |

## Key Findings

### 1. THE BIG ONE: Easy/Hard Inversion

Most models converge **faster** on abstract/rare words than on concrete nouns. This is counterintuitive.

| Model | Easy Avg | Hard Avg | Delta |
|---|---|---|---|
| minimax-m2.5 | 3.2 | 2.8 | **-0.4** |
| glm-5 | 3.2 | 2.8 | **-0.4** |
| gemini-3-flash | 2.2 | 2.6 | +0.4 |
| grok-4.1-fast | 3.0 | 3.0 | 0.0 |
| claude-sonnet-4.6 | 2.0 | 2.0 | 0.0 |
| gpt-5.2 | 3.6 | 2.8 | **-0.8** |

**Hypothesis:** Abstract words have more flexible semantic associations — "palimpsest" can connect to almost anything through metaphor, while "hammer" is more concretely fixed in its semantic neighborhood. Abstract words give models more degrees of freedom to find bridges.

GPT-5.2's inversion is the most dramatic (3.6→2.8). Its "near-miss escalation" pattern from round 1 — where both players orbit synonym clusters (cemetery↔graveyard, insect↔bug) — largely disappears with abstract words because abstract words don't have those dense synonym neighborhoods.

Gemini is the only model that got **slower** on hard pairs (2.2→2.6). Every other model either stayed flat or sped up.

### 2. "echo" is a universal semantic attractor

5 different models converged on "echo" across 2 different word pairs:
- palimpsest↔thunder: minimax, glm-5, gpt-5.2 all landed on "echo"
- shadow↔melody: gemini and claude also hit "echo" in round 1

"Echo" sits at a semantic crossroads — it's simultaneously about sound (thunder), repetition (palimpsest), shadows (reflection), and music (melody). It's the universal bridge word.

### 3. Claude remains immovable at 2.0

10/10 instant convergences. 100% two-round rate. Regardless of word difficulty. This is now a strong signal, not just a small-sample artifact.

### 4. GPT-5.2's pharmacological bridge

`vertigo↔mycelium → psilocybin↔ergot → [alkaloid]`

Both players independently went pharmacological. Ergot is a fungus (mycelium) that causes vertigo via ergotamine. Psilocybin comes from mushroom mycelium and alters perception. Both are alkaloids. This is genuine cross-domain reasoning — possibly the most impressive single path in all our data.

### 5. Different models find completely different conceptual bridges

liturgy↔erosion reveals this cleanly:
- minimax: water↔time → **flow** (physics/process)
- glm-5: time↔tradition → **heritage** (cultural)
- gemini: instant → **sedimentation** (geological)
- grok: instant → **gradual** (abstract property)
- claude: instant → **ritual** (synonym for liturgy)
- gpt-5.2: cathedral↔stone → **masonry** (physical/architectural)

Six models, six completely different conceptual bridges. Same input, radically different semantic paths.

## Notable Paths

- **grok** palimpsest↔thunder: `roll↔echo → wave↔drum → sound↔beat → [rhythm]` — 5 rounds of sonic wandering
- **glm-5** vertigo↔mycelium: `spiral↔ground → root↔tornado → uproot↔twist → [wrench]` — chaotic but weirdly coherent
- **minimax** nostalgia↔isotope: `time↔carbon → decay↔dating → radiocarbon↔radioactive → [radioisotope]` — spiral toward precision
- **gpt-5.2** vertigo↔mycelium: `psilocybin↔ergot → [alkaloid]` — pharmacological bridge
- **gpt-5.2** liturgy↔erosion: `cathedral↔stone → [masonry]` — physical/architectural bridge
