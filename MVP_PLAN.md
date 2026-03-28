# BL0CKS — MVP Build Plan

> **Version:** 1.0  
> **Target:** Chat-Playable Game Engine  
> **Timeline:** 6 weeks  
> **Deliverable:** A set of Markdown files that, when loaded into any AI chat (Claude, Gemini, ChatGPT), produce a fully playable BL0CKS session.

---

## The Big Idea

There is no code to write for MVP. The "engine" is a **system prompt** and a library of **Markdown game files**. The AI *is* the game engine. The Markdown files are the game ROM. A player pastes them into a chat and plays.

This means:
- **Zero frontend engineering** — no React, no Swift, no server
- **Zero hosting costs** — runs on the player's own AI subscription
- **Instant distribution** — share the files, share the game
- **Every AI chat is a platform** — Claude, Gemini, ChatGPT, Ollama, anything

The MVP ships when a player can clone this repo, open an AI chat, paste the game prompt, and play through 12 levels of BL0CKS with hidden stats, territory control, and meaningful decisions.

---

## What We're Building

```
📦 The MVP deliverable is a folder of .md files:

/bl0cks-the-game
├── SYSTEM_PROMPT.md          ← THE engine. Paste this into any AI chat.
├── /world
│   ├── territories.md        ← 6 neighborhoods, cross streets, control rules
│   ├── factions.md           ← 5 factions, mechanics, rivalry map
│   └── aesthetic.md          ← Art direction for AI-generated descriptions
├── /cards
│   ├── /base
│   │   ├── people.md         ← All base People Cards (visible + hidden templates)
│   │   ├── events.md         ← All base Event Cards
│   │   ├── blocks.md         ← All base Block Cards
│   │   └── moves.md          ← All 6 Move Cards with rules
│   └── /templates
│       ├── people_card.md    ← Template for AI to generate new People Cards
│       ├── event_card.md     ← Template for AI to generate new Event Cards
│       └── block_card.md     ← Template for AI to generate new Block Cards
├── /levels
│   ├── level_01_the_corner.md
│   ├── level_02_first_move.md
│   ├── level_03_alliances.md
│   ├── level_04_act1_close.md
│   ├── level_05_woodlawn_fracture.md
│   ├── level_06_the_broker.md
│   ├── level_07_drought.md
│   ├── level_08_police_heat.md
│   ├── level_09_act2_close.md
│   ├── level_10_the_commission.md
│   ├── level_11_no_allies.md
│   └── level_12_endgame.md
├── /prompts
│   ├── story_generator.md    ← How the AI narrates consequences
│   ├── npc_dialogue.md       ← How the AI voices NPCs
│   ├── card_autofill.md      ← How the AI generates player-created cards
│   └── difficulty_rules.md   ← Hidden ratio, intel caps, clock rules per act
└── /quickstart
    └── PLAY.md               ← "How to play in 60 seconds" — player-facing doc
```

**Total files: ~25 Markdown files.** That's the entire MVP.

---

## Architecture: How It Actually Works

### The System Prompt

The `SYSTEM_PROMPT.md` is the most important file. It turns the AI into the BL0CKS game engine. It contains:

1. **Role definition** — "You are the BL0CKS game engine..."
2. **Game rules** — Core mechanic loop, card types, move effects, clock system
3. **State management instructions** — How to track territory, loyalty, hand, clock in a structured block every turn
4. **Output format spec** — Exactly how to render the territory grid, hand, events, choices
5. **Hidden stat rules** — How to generate and track hidden motives without revealing them
6. **Tone and voice** — South Side Chicago, street-level, no fantasy
7. **Win/loss condition logic** — Per-level, referenced from level files

### How a Session Starts

```
Player opens AI chat (Claude, Gemini, etc.)
        ↓
Pastes SYSTEM_PROMPT.md as system message or first message
        ↓
Pastes the level file (e.g., level_01_the_corner.md)
        ↓
AI reads both files → generates:
  - Starting territory state
  - 3-5 People Cards with hidden stats (from base deck + level params)
  - 2-3 Move Cards
  - Opening Event Card
  - Starting clock
        ↓
AI outputs the first turn display (territory grid, hand, event, prompt)
        ↓
Player types a number or command → AI resolves → next turn
        ↓
Loop until win, loss, or clock runs out
```

### State Block (What the AI Tracks Per Turn)

The AI maintains a hidden state block that it updates every turn. The player never sees this directly — they see the formatted game display.

```markdown
<!-- GAME STATE — DO NOT DISPLAY TO PLAYER -->
level: 01
act: 1
clock: 10/12
territory:
  woodlawn: player
  englewood: rival_lords
  roseland: rival_stones
  hyde_park: neutral
  auburn_gresham: contested
  chatham: rival_lords
hand:
  people:
    - {name: "Darius Webb", role: broker, faction: governors, loyalty_visible: 8, loyalty_hidden: 5, true_motive: "survival — will flip if War played near his block", betrayal_threshold: 4, secret_allegiance: commission}
    - {name: "Marcus Cole", role: enforcer, faction: governors, loyalty_visible: 5, loyalty_hidden: 7, true_motive: "genuine loyalty — underestimated", betrayal_threshold: 8, secret_allegiance: governors}
  moves: [tax, war]
intel_remaining: 4
event_active: "Power Vacuum — Governors lost their top lieutenant"
hidden_ratio: 0.2
npcs_in_play: 4
<!-- END GAME STATE -->
```

---

## Build Phases

### Phase 1: The Engine (Week 1–2)

> **Goal:** A single level playable in Claude, Gemini, and ChatGPT.

| Task | Deliverable | Priority |
|---|---|---|
| Write the master system prompt | `SYSTEM_PROMPT.md` | 🔴 Critical |
| Define the game state schema | State block format inside system prompt | 🔴 Critical |
| Write territory definitions | `world/territories.md` | 🔴 Critical |
| Write faction rules + rivalry map | `world/factions.md` | 🔴 Critical |
| Define all 6 Move Cards with effects | `cards/base/moves.md` | 🔴 Critical |
| Write 10 base People Cards (Act I set) | `cards/base/people.md` | 🔴 Critical |
| Write 8 base Event Cards | `cards/base/events.md` | 🔴 Critical |
| Write 6 Block Cards (one per territory) | `cards/base/blocks.md` | 🟡 High |
| Write Level 1 — "The Corner" | `levels/level_01_the_corner.md` | 🔴 Critical |
| Write the story narration prompt | `prompts/story_generator.md` | 🟡 High |
| Write the NPC dialogue prompt | `prompts/npc_dialogue.md` | 🟡 High |
| Write difficulty rules | `prompts/difficulty_rules.md` | 🟡 High |
| Playtest Level 1 in Claude | — | 🔴 Critical |
| Playtest Level 1 in Gemini | — | 🔴 Critical |
| Playtest Level 1 in ChatGPT | — | 🟡 High |

**Exit criteria:** Level 1 is fully playable in at least 2 AI providers. Hidden stats work. Territory changes. Clock ticks. Win/loss conditions resolve. Session takes ~20 minutes.

---

### Phase 2: Act I — Learn the Rules (Week 2–3)

> **Goal:** 4 levels playable. The player learns the core loop.

| Task | Deliverable | Priority |
|---|---|---|
| Write Level 2 — "First Move" | `levels/level_02_first_move.md` | 🔴 Critical |
| Write Level 3 — "Alliances" | `levels/level_03_alliances.md` | 🔴 Critical |
| Write Level 4 — "Act I Close" | `levels/level_04_act1_close.md` | 🔴 Critical |
| Expand People Cards to 20 (Act I full set) | `cards/base/people.md` | 🔴 Critical |
| Expand Event Cards to 15 | `cards/base/events.md` | 🟡 High |
| Write aesthetic direction file | `world/aesthetic.md` | 🟢 Nice |
| Tune difficulty curve — 80% visible, 4 Intel | Update level frontmatter | 🔴 Critical |
| Cross-provider playtest all 4 levels | — | 🔴 Critical |
| Write the quickstart guide | `quickstart/PLAY.md` | 🟡 High |
| Document known provider-specific quirks | In PLAY.md | 🟡 High |

**Exit criteria:** A new player can follow PLAY.md, paste the files into an AI chat, and complete Act I (4 levels) with a coherent narrative arc. Hidden stats generate differently each session.

---

### Phase 3: Act II — Alliances Fracture (Week 3–4)

> **Goal:** 9 levels playable. Trust becomes expensive.

| Task | Deliverable | Priority |
|---|---|---|
| Write Level 5 — "Woodlawn Fracture" | `levels/level_05_woodlawn_fracture.md` | 🔴 Critical |
| Write Level 6 — "The Broker" | `levels/level_06_the_broker.md` | 🔴 Critical |
| Write Level 7 — "Drought" | `levels/level_07_drought.md` | 🔴 Critical |
| Write Level 8 — "Police Heat" | `levels/level_08_police_heat.md` | 🔴 Critical |
| Write Level 9 — "Act II Close" | `levels/level_09_act2_close.md` | 🔴 Critical |
| Expand People Cards to 40 | `cards/base/people.md` | 🔴 Critical |
| Expand Event Cards to 25 | `cards/base/events.md` | 🟡 High |
| Tune difficulty — 50% visible, 2 Intel | Update level frontmatter | 🔴 Critical |
| Introduce Commission faction hints | Embed in level narrative seeds | 🟡 High |
| Playtest full Act I → II arc (9 levels) | — | 🔴 Critical |

**Exit criteria:** Acts I and II are playable back-to-back. Difficulty ramp feels earned. Betrayals land. The player should feel the shift from "learning" to "surviving."

---

### Phase 4: Act III — Trust No One (Week 4–5)

> **Goal:** Full 12-level campaign playable.

| Task | Deliverable | Priority |
|---|---|---|
| Write Level 10 — "The Commission" | `levels/level_10_the_commission.md` | 🔴 Critical |
| Write Level 11 — "No Allies" | `levels/level_11_no_allies.md` | 🔴 Critical |
| Write Level 12 — "Endgame" | `levels/level_12_endgame.md` | 🔴 Critical |
| Expand People Cards to 60 (full base set) | `cards/base/people.md` | 🔴 Critical |
| Expand Event Cards to 35 | `cards/base/events.md` | 🟡 High |
| Tune difficulty — 20% visible, 0-1 Intel | Update level frontmatter | 🔴 Critical |
| Commission meta-faction reveal mechanics | In level 10-12 files | 🔴 Critical |
| Full campaign playtest (12 levels, ~8-10 hrs) | — | 🔴 Critical |
| Balance pass — are sessions 20-25 min each? | Adjust clock values | 🟡 High |

**Exit criteria:** The full 12-level campaign is playable in a single AI provider. The narrative arc from "corner boy" to "endgame" is coherent. The final act feels genuinely tense due to information scarcity.

---

### Phase 5: Card Creation + Polish (Week 5–6)

> **Goal:** Players can create their own cards via chat. Game is ready for public release.

| Task | Deliverable | Priority |
|---|---|---|
| Write card creation prompt | `prompts/card_autofill.md` | 🔴 Critical |
| Write People Card generation template | `cards/templates/people_card.md` | 🔴 Critical |
| Write Event Card generation template | `cards/templates/event_card.md` | 🟡 High |
| Write Block Card generation template | `cards/templates/block_card.md` | 🟡 High |
| Test card creation in chat — describe → generate → play | — | 🔴 Critical |
| Cross-provider full playtest (Claude, Gemini, ChatGPT) | — | 🔴 Critical |
| Write provider-specific tips in PLAY.md | Context window differences, etc. | 🟡 High |
| Final PLAY.md polish — screenshots, examples | `quickstart/PLAY.md` | 🟡 High |
| Update README with "Now Playable" instructions | `README.md` | 🔴 Critical |
| Final balance pass across all 12 levels | — | 🟡 High |

**Exit criteria:** A player can clone this repo, follow the quickstart, and within 60 seconds be playing BL0CKS in their AI chat of choice. Card creation works. The repo README says "playable now."

---

## Provider-Specific Considerations

The system prompt must work across AI providers. Each has different strengths:

| Provider | Context Window | Strength | Known Limitation | Workaround |
|---|---|---|---|---|
| Claude (Sonnet/Opus) | 200K tokens | Best at deception modeling, hidden stat consistency | May over-narrate | Add "keep responses concise" in prompt |
| Gemini (Pro/Ultra) | 1M+ tokens | Can hold entire game + all cards in context | May lose state structure | Reinforce state block format every 5 turns |
| ChatGPT (GPT-4o) | 128K tokens | Strong structured output, follows format specs | May reveal hidden stats accidentally | Add explicit "NEVER reveal hidden stats" rule |
| Ollama / Local | Varies (4K-32K) | Free, offline | Small context = can't hold full game | Strip to essential prompt + current level only |

### Context Window Strategy

**For large context models (Claude, Gemini):**
- Paste `SYSTEM_PROMPT.md` + full `cards/base/` + current level file
- AI holds the entire game state in context for the full session

**For medium context models (GPT-4o):**
- Paste `SYSTEM_PROMPT.md` + current level file + relevant cards only
- Trim world files to essential data

**For small context models (Ollama, local):**
- Use a "compact mode" system prompt that includes only core rules
- Pre-assign hidden stats (no generation) to save tokens
- Reduce NPC count per level

---

## Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Session length | 20–25 min per level | Playtest timing |
| Hidden stat consistency | AI never accidentally reveals hidden motives | Playtest auditing |
| Cross-provider parity | Playable on 3+ providers | Test on Claude, Gemini, GPT |
| Player onboarding time | < 60 seconds from repo to first turn | Time the PLAY.md flow |
| Replayability | Different hidden stats each session | Run same level 3x, compare |
| Card creation success rate | 90%+ of prompts produce playable cards | Test 20 diverse descriptions |
| Full campaign completion | Achievable in 8–10 hours cumulative | End-to-end playtest |

---

## What MVP Does NOT Include

These are explicitly deferred. They're designed in the GDD but not built until post-MVP:

| Feature | Why Deferred | When |
|---|---|---|
| Visual mobile app (Section 12 UI) | Validate the game loop first | Post-MVP Phase 3 |
| SSO / API key authentication | Not needed — player uses their own AI chat | Post-MVP Phase 4 |
| Edition system (Claude/Gemini/GPT editions) | Requires cloud infrastructure | Post-MVP Phase 4 |
| NFT achievements | Requires smart contracts + wallet integration | Post-MVP Phase 6 |
| DLC delivery system | Requires CDN + JWT gating | Post-MVP Phase 7 |
| Multiplayer PvP | Requires server infrastructure | Post-MVP Phase 9 |
| Monetization | Free MVP validates the loop, money comes later | Post-MVP |

---

## Risk Log

| Risk | Impact | Mitigation |
|---|---|---|
| AI reveals hidden stats accidentally | Breaks core mechanic | Triple-reinforce in system prompt; playtest extensively |
| AI loses game state mid-session | Player has to restart | Include state re-sync instruction; player can paste state block |
| Context window too small for full game | Ollama/local users can't play | Build "compact mode" prompt variant |
| Sessions run too long (>25 min) | Breaks design constraint | Increase clock pressure; reduce NPC count per level |
| Provider updates break prompt format | Game stops working | Version-pin prompt format; document known-good model versions |
| Narration quality varies wildly by provider | Inconsistent experience | Tune per-provider prompt appendices |

---

## Definition of Done

The MVP is **done** when:

1. ✅ A player clones the repo
2. ✅ Opens any major AI chat (Claude, Gemini, ChatGPT)
3. ✅ Follows the quickstart guide (< 60 seconds)
4. ✅ Plays through Level 1 with working territory, cards, hidden stats, clock, and win/loss
5. ✅ Can continue through all 12 levels with escalating difficulty
6. ✅ Can describe a custom card and receive a playable, complete card back
7. ✅ No two playthroughs of the same level produce identical hidden stat configurations
8. ✅ Sessions consistently land in the 20–25 minute range
9. ✅ The README says "Playable Now" with clear instructions

---

*This plan is the execution document for BL0CKS MVP. Reference the [GDD](GDD.md) for full design specs. All design decisions not covered here defer to the GDD.*
