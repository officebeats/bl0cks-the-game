<!-- 
  ╔══════════════════════════════════════════════════════════════════╗
  ║  BL0CKS — Game Design Document v3.0                              ║
  ║                                                                  ║
  ║  HOW TO USE THIS TEMPLATE:                                       ║
  ║  1. Fork/clone this repository                                   ║
  ║  2. Search for all {{PLACEHOLDER}} values and replace them       ║
  ║  3. Values marked [TEMPLATE] are swappable world-layer content   ║
  ║  4. Values marked [ENGINE] are core mechanics — modify carefully ║
  ║  5. Values marked [CLOUD] require server-side implementation     ║
  ║  6. Bump the version number on any breaking design change        ║
  ║                                                                  ║
  ║  PLACEHOLDER KEY:                                                ║
  ║  {{GAME_TITLE}}        — Your game's name                       ║
  ║  {{DESIGNER_NAME}}     — Lead designer / creator                 ║
  ║  {{DATE}}              — Document date                           ║
  ║  {{SETTING_CITY}}      — City / region for world layer           ║
  ║  {{SETTING_AREA}}      — Specific area within city               ║
  ║  {{FACTION_1..N}}      — Faction names and analogs               ║
  ║  {{TERRITORY_1..N}}    — Territory / neighborhood names          ║
  ║  {{PROVIDER_1..N}}     — AI provider names and key prefixes      ║
  ║  {{EDITION_1..N}}      — Edition names tied to providers         ║
  ║  {{NFT_CHAIN}}         — Blockchain for NFT achievements         ║
  ║  {{SESSION_LENGTH}}    — Target session duration in minutes      ║
  ║  {{CARD_WIDTH}}        — Card render width in px                 ║
  ║  {{CARD_HEIGHT}}       — Card render height in px                ║
  ╚══════════════════════════════════════════════════════════════════╝
-->

# BL0CKS — Game Design Document v3.0

> **Status:** Active Development  
> **Version:** 3.0 — Mechanics-Complete Revision  
> **Lead Designer:** Ernesto "Beats" Rodriguez  
> **Date:** March 2026  
> **Classification:** Confidential — Not For Distribution  
> **Changelog:** v3.0 integrates core gameplay mechanics (Resource Economy, Keyword Synergies, Heat System, Gambit System, The Stash, The Ledger) into the GDD proper. Absorbs STS_MECHANICS_INTEGRATION.md. All new systems annotated `[ENGINE]`.

---

## Table of Contents

1. [Vision Statement](#1-vision-statement)
2. [Core Design Pillars](#2-core-design-pillars)
3. [World Design](#3-world-design)
4. [Card System](#4-card-system)
    - [4.1 Card Types](#41-card-types)
    - [4.2 The Hidden Stat System](#42-the-hidden-stat-system)
    - [4.3 Core Mechanic Loop](#43-core-mechanic-loop)
    - [4.4 Move Cards — Full Spec](#44-move-cards--full-spec)
    - [4.5 Assets & The Stash](#45-assets--the-stash)
    - [4.6 Card Anatomy — Physical Spec](#46-card-anatomy--physical-spec)
    - [4.7 Resource Economy — Influence](#47-resource-economy--influence)
    - [4.8 Keyword & Synergy System](#48-keyword--synergy-system)
    - [4.9 The Gambit System](#49-the-gambit-system)
    - [4.10 The Heat Meter](#410-the-heat-meter)
    - [4.11 The Ledger — Persistent Consequences](#411-the-ledger--persistent-consequences)
5. [Level Design & Difficulty Curve](#5-level-design--difficulty-curve)
6. [AI Architecture & Multi-Model System](#6-ai-architecture--multi-model-system)
7. [Card Creation Engine](#7-card-creation-engine)
8. [DLC System](#8-dlc-system)
9. [NFT Achievement System](#9-nft-achievement-system)
10. [Community Systems](#10-community-systems)
11. [Monetization Architecture](#11-monetization-architecture)
12. [UI/UX Requirements — Mobile-First](#12-uiux-requirements--mobile-first)
    - [12.1 Design System & Tokens](#121-design-system--tokens)
    - [12.2 Onboarding & API Key Entry Flow](#122-onboarding--api-key-entry-flow)
    - [12.3 Core Gameplay — Card Table](#123-core-gameplay--card-table)
    - [12.4 Card Creation Engine UI](#124-card-creation-engine-ui)
13. [Build Roadmap](#13-build-roadmap)
14. [Markdown File Architecture](#14-markdown-file-architecture)
15. [Open Design Questions](#15-open-design-questions)

---

## 1. Vision Statement

<!-- [TEMPLATE] — Rewrite this section for your game's thematic identity -->

*From the designer's chair —*

BL0CKS is not a game about crime. It is a game about **trust** — and the extraordinary cost of misplacing it.

Set against the hyper-specific geography of Chicago's South Side — real cross streets, real neighborhood names, fictionalized but grounded faction structures — BL0CKS asks players to manage alliances, information, and loyalty in a world where everyone is playing their own game simultaneously.

What makes BL0CKS structurally unique is that it is the first strategy card game built natively on **Markdown files**, driven by a large language model, and architected to run on any major AI provider the player chooses to bring. The game knows what model it is running on. It adapts. It improves with the model's capabilities. It rewards players who invest in better AI with richer, more complex narrative experiences.

The second hook — and the one that will make this **viral** — is the Card Creation Engine. BL0CKS is not just a game. It is a **game factory**. Players will clone the engine, swap the world files, and rebuild it as their own. The cultural surface is infinite. The engine is the product.

> **Design North Star:** Every mechanic must serve one of three pillars: **Territory, Trust, or Time.** If a card, event, or system does not touch at least one pillar, it does not belong in the game.

> **Fun North Star:** Every turn must force the player to make a decision they feel in their gut. The question is never "what should I do?" — it's "what can I afford to *lose*?" Great strategy games make you feel like a genius when you win and like it was *your* fault when you lose. BL0CKS achieves this through resource scarcity, predictive information, and irreversible consequences.

---

## 2. Core Design Pillars

<!-- [ENGINE] — These three pillars define ALL mechanic gates. Modify with caution. -->

### 2.1 Territory

The block is the unit of power. Players accumulate, defend, broker, and lose territory through card decisions. Every card drawn is anchored to a specific South Side location — 63rd & Cottage Grove, 79th & Stony Island, Marquette Park, The Robert Taylor Corridor. **Geography is not flavor. Geography is the board.**

### 2.2 Trust

Every character in the game has a **visible loyalty score** and a **hidden true motive** known only to the AI. Players must spend resources to reveal hidden information. The fundamental tension: do you spend an Intel Card to verify an ally, or do you trust the visible number and move faster?

This is the deception layer. Betrayals are not random events. They are **earned outcomes** of the player's own risk tolerance.

### 2.3 Time

Every decision costs clock ticks. The police scanner ticks. Rival factions move. The longer a player deliberates, the more the board shifts. Time pressure creates urgency that prevents over-analysis and keeps sessions under 25 minutes — a **hard design constraint.**

> **Session Length Target:** Core loop = 20–25 minutes per session. Full 12-level arc = 8–10 hours of cumulative play.

---

## 3. World Design

<!-- [TEMPLATE] — This entire section is the swappable "world layer." 
     Fork creators: replace all territories, factions, and aesthetic direction. -->

### 3.1 Setting

South Side Chicago, present day. The game draws from the real neighborhood grid — ward boundaries, CTA stops, park districts, and commercial corridors serve as territory anchors.

<!-- [TEMPLATE] Replace the table below with your game's territories -->

| Neighborhood | Territory Type | Faction Presence | Key Cross Streets |
|---|---|---|---|
| Englewood | Contested — high volatility | The Governors (GD analog) | 63rd & Halsted, 71st & Racine |
| Woodlawn | Mid-tier, economic pressure | The Lords (ViceLord analog) | 63rd & Cottage Grove, 67th & Stony Island |
| Roseland | Outer territory, expansion zone | The Stones (Stone analog) | 111th & Michigan, 103rd & Wentworth |
| Hyde Park | Neutral / Political zone | Independents + Law | 53rd & Lake Park, 57th & Woodlawn Ave |
| Auburn Gresham | Supplier corridor | Mixed — rotating control | 79th & Halsted, 83rd & Ashland |
| Chatham | Civilian density, high heat | Law enforcement pressure zone | 79th & Cottage Grove, 87th & King Drive |

### 3.2 Faction Structure

<!-- [TEMPLATE] — Factions are fictionalized analogs. Named differently but structurally accurate.
     This is the GTA design philosophy — close enough to be authentic, different enough to be defensible. -->

| Faction | Real Analog | Core Mechanic | Board Color |
|---|---|---|---|
| The Governors | Gangster Disciples | Board control — expand or die | Blue |
| The Lords | Vice Lords | Alliance brokering — political | Gold |
| The Stones | Blackstone Rangers | Unpredictable — random event triggers | Red |
| The Commission | Consolidated leadership | Endgame only — meta-faction | Black |
| The Law | CPD / Federal | Neutral antagonist — always present | Gray |

### 3.3 Aesthetic Direction

<!-- [TEMPLATE] — Art direction is world-layer. Swap for your fork's visual identity. -->

- **Visual style:** Hand-drawn map overlays, lo-fi street photography filters, AI-generated card illustrations per session
- **Music:** Territory-specific generative lo-fi beats — tempo increases as clock pressure builds
- **Typography:** Utilitarian, street-sign influenced — no fantasy fonts, no ornamentation
- **Color language:** Territory color-coded on the board; faction colors consistent across all card types
- **Animation:** Card flips, territory control ripples, betrayal shake effects — all defined per interaction in Section 12

---

## 4. Card System

<!-- [ENGINE] — Card types and mechanics are core engine. Card CONTENT is swappable. -->

### 4.1 Card Types

| Card Type | Function | Max in Hand | Source |
|---|---|---|---|
| Block Cards | Territory control and status — the board state | Always in play | Board draw |
| People Cards | Characters with visible + hidden stats | 5 | Deck draw |
| Move Cards | Player actions: Tax, Ghost, Snitch, Stack, War, Peace | 3 | Deck draw |
| Event Cards | Environmental chaos — raids, vacuums, droughts | Auto-triggered | System draw each turn |
| Status Cards | "Heat" and "Paranoia" — dead draws that clog hand limit | Varies | Enemy Action |
| Intel Cards | Reveal hidden character motives and faction plans | 2 | Earned — rare |
| DLC Cards | Edition-exclusive or community-built — inject into any deck | Varies | Import / unlock |

### 4.2 The Hidden Stat System

<!-- [ENGINE] — This is the mechanical heart of BLOCKS. Do not modify without full team review. -->

Every People Card has two layers:

**Visible Layer** (always shown to player):
- Loyalty score: 0–10
- Role: Enforcer / Broker / Informant / Runner
- Block affiliation
- Faction badge

**Hidden Layer** (known only to the AI — never displayed unless Intel Card is spent):
- True motive
- Flip trigger condition
- Betrayal threshold
- Secret allegiance (may differ from displayed faction)

The AI generates the hidden layer from the character's Markdown template at session start. **No two sessions produce identical character states.** Players cannot memorize the game — they must learn to read it.

> **Designer Note:** The hidden stat is what separates BL0CKS from Reigns. In Reigns, you react to information. In BL0CKS, you are always operating on incomplete information — and your ability to handle that gap is the skill being tested.

### 4.3 Core Mechanic Loop

<!-- [ENGINE] — Core loop is fixed. Content within each step is world-layer swappable. -->

**The Turn — 10 Phases**

Every turn follows this exact sequence. The player has agency in phases 4–7. The rest is engine-resolved.

| Phase | Name | Who Acts | What Happens |
|---|---|---|---|
| 1 | **Dawn** | Engine | Influence resets to base (default 3). Any "start of turn" Asset effects trigger. |
| 2 | **Draw** | Engine | Fill hand to 5 cards (People + Moves + Status). Status cards (Paranoia, Heat) count against hand limit. |
| 3 | **Street Whisper** | Engine | AI broadcasts **predictive intent** — what rival factions or police *will do* at end of turn if not blocked. This is open information. The player knows what's coming. |
| 4 | **Scheme** | Player | Player surveys hand, territory, clock, Heat Meter, and active Assets. Plans turn. No Influence spent yet. |
| 5 | **Act** | Player | Player plays cards from hand. Each card costs 1–3 Influence (see 4.7). Player can play as many cards as Influence allows. Playing a People Card triggers a binary/gambit choice (see 4.9). Playing a Move Card executes its effect immediately. |
| 6 | **Combo** | Engine | Any keyword triggers chain-resolve (see 4.8). If the player's actions this turn activated a keyword combo, bonus effects apply now. |
| 7 | **Burn** | Player (optional) | Player may voluntarily **Exhaust** one card from hand — permanently removes it from the deck pool. Thinning the deck is a core strategy. Exhausting costs 0 Influence but the card is gone forever. |
| 8 | **Intent Resolves** | Engine | Any unblocked Street Whisper intents execute. Territory flips, loyalty drops, Heat cards inject into deck, clock ticks. |
| 9 | **Heat Check** | Engine | Global Heat Meter advances by 1. If Heat crosses a threshold, a permanent global modifier activates (see 4.10). |
| 10 | **Dusk** | Engine | Clock ticks by the total tick cost of this turn's actions. Win/loss conditions checked. If clock hits 0 or conditions met, level ends. Otherwise → next turn at Phase 1. |

> **The Core Tension:** You have 3 Influence. A defensive Enforcer costs 2. A Tax to generate long-term advantage costs 1. The Street Whisper says the Lords are hitting Auburn Gresham. Do you block the assault (2 Influence, safe), Tax Woodlawn for resources (1 Influence, long play), and then have 0 left to play your Broker who could flip Chatham? Or do you let Auburn Gresham fall, play your Broker (1 Influence) and Tax (1 Influence) and War (1 Influence) to win two blocks while losing one? **This is the game.**

### 4.4 Move Cards — Full Spec

<!-- [TEMPLATE] — Move names and flavor are swappable. Mechanic effects are [ENGINE]. -->

Move Cards now scale with board state. Each card lists its **base** effect and its **powered** effect (triggered when conditions are met).

| Move | Influence Cost | Base Effect | Powered Condition | Powered Effect | Clock Cost |
| **Tax** | 1 | Collect 1 resource from a controlled block. | You control 3+ blocks. | Collect from ALL controlled blocks. +1 Influence next turn. | 1 tick |
| **Ghost** | 0 | Disappear from a block. Remove your marker. Block becomes uncontrolled. | You have 0 Status Cards in hand. | Ghost is silent — no Heat generated. Rival factions don't notice for 1 turn. | 0 ticks |
| **Snitch** | 2 | Reveal one hidden stat on any People Card (free Intel — doesn't cost Intel token). | Target has Loyalty ≤ 4. | Reveal ALL hidden stats. But that character's betrayal threshold drops by 3. | 2 ticks |
| **Stack** | 2 | Fortify a block. +2 Block Points (temporary shields that absorb assault damage). | An Enforcer is active in the target block. | +4 Block Points instead. Combo: triggers Enforcer's keyword. | 2 ticks |
| **War** | 3 | Challenge a rival block. AI resolves combat: highest combined Loyalty of your People Cards in/adjacent vs. rival NPCs. Winner takes territory. | You've played War in 2 consecutive turns. | **Blitz** — War costs 2 Influence instead of 3. But generates +2 Heat. | 1 tick |
| **Peace** | 1 | Broker a temporary alliance. Contested block becomes shared for 3 turns. | Both factions have People Cards with Loyalty ≥ 7. | Alliance lasts 5 turns. Shared block generates resources for both. | 1 tick |
| **Burn** | 0 | Exhaust a card from hand or deck. Permanent removal. | Card being burned is a Status Card (Paranoia/Heat). | Burning a Status Card grants +1 Influence immediately (relief bonus). | 0 ticks |

### 4.5 Assets & The Stash

<!-- [ENGINE] — Persistent, rule-breaking passive buffs inspired by Slay the Spire.
     Asset EFFECTS are engine. Asset NAMES and FLAVOR are [TEMPLATE]. -->

Assets provide **permanent structural buffs for the entire run.** They are the primary progression reward between levels and the core reason no two runs feel the same.

#### How The Stash Works

After completing each level, the player enters **The Stash** — a reward screen where they choose **1 of 3 randomly offered Assets.** This is the moment of strategic investment. Assets are permanent for the rest of the campaign run.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THE STASH — LEVEL 3 COMPLETE
  Choose 1 Asset. This is permanent.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [A] 🍽️  THE GREEK DINER
      First Intel card each level is free.
      (Info advantage — know more, faster)

  [B] 🔫  CORNER ARMORY
      Enforcers gain +1 Block Point when defending.
      (Defensive scaling — territory holds longer)

  [C] 📱  BURNER NETWORK
      Hand size +1 (draw 6 instead of 5).
      Must Exhaust 1 card at start of each level.
      (Card advantage with a cost)

  Your pick? (A, B, or C)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Asset Pool — Full Spec

| Asset | Effect | Category | Unlock Condition |
|---|---|---|---|
| **The Greek Diner** | First Intel card played each level costs 0 Influence | Information | Available from Level 2+ |
| **Crooked Alderman** | Ignore one Police-type Street Whisper intent per level | Defense | Available from Level 3+ |
| **Burner Network** | Hand size +1 (6 cards). Must Exhaust 1 card at start of each level. | Card Advantage | Available from Level 2+ |
| **Corner Armory** | All Enforcers gain +1 Block Point passive buff | Defense | Available from Level 3+ |
| **The Plug** | Tax generates double resources from the first block taxed each turn | Economy | Available from Level 4+ |
| **Ghost Protocol** | Ghost move also clears 1 Status Card from hand for free | Utility | Available from Level 3+ |
| **Bail Money** | Once per level, prevent a People Card from being lost in a failed War | Recovery | Available from Level 5+ |
| **Wire Tap** | At the start of each level, reveal 1 hidden stat on a random NPC for free | Information | Available from Level 4+ |
| **OG Status** | +1 base Influence per turn (permanent 4 instead of 3) | Economy | Available from Level 7+ (Act II only) |
| **Safe House** | When you lose a territory, 1 People Card in that block auto-escapes to your nearest block | Recovery | Available from Level 6+ |
| **Inside Man** | Peace alliances last +2 turns and cannot be broken by enemy intent | Diplomacy | Available from Level 5+ |
| **Cold Hands** | Burn (Exhaust) moves grant +2 Influence instead of +1 when burning Status Cards | Deck Thinning | Available from Level 4+ |

> **Design Rule:** Assets should *feel* like cheating in a good way. Each one should make the player grin when they see it offered. The best Assets change how you evaluate every card in your hand.

#### Asset Stacking

Assets **stack and synergize** — two Assets together can be more powerful than the sum of their parts:

- **Wire Tap + The Greek Diner:** You start each level already knowing a hidden stat AND get your first Intel free = Act II feels almost like Act I difficulty.
- **Burner Network + Cold Hands:** Extra card draw + boosted Exhaust rewards = aggressive deck-thinning archetype.
- **Corner Armory + Safe House:** Your territories are nearly impossible to crack = fortress playstyle.

The AI should narratively acknowledge Asset combos when they trigger ("Your Corner Armory boys stacked the block while the Safe House network pulled Marcus out before the Lords even got to Cottage Grove").

### 4.6 Card Anatomy — Physical Spec

<!-- [ENGINE] — Card dimensions and layout zones are fixed. Visual treatment is [TEMPLATE]. -->

Each card renders at **343 × 480px (mobile)** or **229 × 320px (compact hand view)**:

```
┌─────────────────────────────────┐  ← Card border: 2px, faction color
│ [FACTION BADGE]  [CARD TYPE]    │  ← Top bar: 48px tall
│  [INFLUENCE COST: ●●○]         │  ← Cost pips: filled = cost, unfilled = max
│─────────────────────────────────│
│                                 │
│      [AI ILLUSTRATION]          │  ← Art zone: 200px tall, full bleed
│         340 × 200px             │
│                                 │
│─────────────────────────────────│
│ CHARACTER NAME                  │  ← Name: 18px bold
│ Role · Block Affiliation        │  ← Sub: 12px, muted
│ [KEYWORD BADGES]                │  ← e.g., ⛨ BLOCK  ◆ CONNECT  ☠ FLIP
│─────────────────────────────────│
│ LOYALTY  ████████░░  8/10       │  ← Progress bar: 24px tall
│─────────────────────────────────│
│ VISIBLE STATS                   │  ← Stat block: 72px tall
│ Enforcer · Woodlawn             │
│ Governors · Active              │
│─────────────────────────────────│
│ [HIDDEN]  ??? / Intel req.      │  ← Hidden stat zone: 40px, locked
└─────────────────────────────────┘
```

---

### 4.7 Resource Economy — Influence

<!-- [ENGINE] — Influence is the core action budget. Do not modify without full review. -->

**Influence** is the per-turn action currency. It is the single most important number in the game.

| Rule | Value |
|---|---|
| **Base Influence per turn** | 3 (can be modified by Assets, e.g., OG Status → 4) |
| **Max Influence per turn** | 6 (hard cap — no stacking beyond this) |
| **Unspent Influence** | Does NOT carry over. Use it or lose it. |
| **Influence generation** | Powered Tax (+1 next turn), Burn Status Card (+1 immediate), some Asset effects |
| **Why 3?** | 3 is the *minimum viable action budget.* You can play a 2-cost Enforcer + 1-cost Tax, OR a 3-cost War, OR three 1-cost actions. You can *never* do everything you want. This is by design. |

**Why Influence Works (Designer's Note):**

The feeling of "I need to do 5 things and I can only afford 3" is the engine of fun. Without Influence, the player can just play every card every turn, which means no trade-offs, which means no strategy, which means no fun. Influence transforms every card from "should I play this?" into "can I *afford* to play this, and what am I giving up if I do?"

> **Example Turn Budget:**
> - Influence: 3
> - Hand: Darius Webb (Broker, cost 1), Marcus Cole (Enforcer, cost 2), TAX (cost 1), WAR (cost 3), PARANOIA (unplayable, cost N/A)
> - Street Whisper: "[INTENT: ASSAULT] Lords are taking Auburn Gresham"
>
> **Option A — Defend:** Play Marcus (2) to block the assault + Tax Woodlawn (1) = 3 spent. Safe play. Auburn Gresham holds. But Darius and War sit unused.
>
> **Option B — Gamble:** Play War on Englewood (3) = 3 spent. You might take Englewood from the Lords — a massive gain. But Auburn Gresham falls undefended.
>
> **Option C — Balanced:** Play Darius (1) to broker info + Tax (1) + save 1 Influence... but you can't spend saved Influence next turn. So this just wastes 1 Influence.
>
> **There is no comfortable choice.** That's what makes it a game.

---

### 4.8 Keyword & Synergy System

<!-- [ENGINE] — Keywords are formalized mechanical effects. Keyword NAMES are [TEMPLATE]. -->

Every People Card and some Move Cards carry **Keywords** — standardized mechanical effects that chain off each other when played in combination.

#### Keyword Definitions

| Keyword | Icon | Effect When Played | Combo Potential |
|---|---|---|---|
| **Block** | ⛨ | Generates Block Points (temporary shields) on a territory. Absorbs enemy Assault damage. Block Points expire at end of turn. | Stack + Block = double Block Points |
| **Connect** | ◆ | Reveals 1 hidden stat on a People Card in the same block. Free intel without spending Intel token. | Connect + Connect (same turn) = reveal 1 additional stat |
| **Flip** | ☠ | If target People Card's hidden loyalty differs from visible loyalty by 3+, trigger a betrayal event. The card turns hostile. | Flip + Snitch (same turn) = betrayal is revealed before it fires, giving player a chance to Burn the card |
| **Hustle** | 💰 | Generates +1 Influence immediately when played. Pays for part of its own cost. | Hustle + Tax = net positive Influence turn (fuels aggressive plays) |
| **Fortify** | 🏰 | Territory where this card is played cannot be contested by War for 1 turn. | Fortify + Peace = unbreakable shared territory for 1 turn |
| **Shadow** | 👻 | This card's play is hidden from rival factions. No Heat generated. | Shadow + War = surprise attack — rival cannot prepare Block Points |
| **Rally** | 📢 | +1 visible loyalty to ALL People Cards in the same block. | Rally + Rally (two People Cards with Rally in same turn) = +2 loyalty each (squad buff) |

#### How Keywords Chain

Keywords trigger during **Phase 6 (Combo)** of the turn. The AI checks:

1. Were 2+ keywords activated this turn?
2. Do any keywords have combo interactions (see "Combo Potential" column)?
3. If yes → resolve bonus effects.

> **Example Combo:** Player plays an Enforcer with ⛨ BLOCK + 💰 HUSTLE (cost 2, but Hustle returns +1 Influence, effective cost 1). Then plays Stack (cost 2). Stack + Block combo triggers → +4 Block Points instead of +2. Auburn Gresham becomes a fortress for 1 Influence less than expected.

**Designer Rule:** Keywords create **emergent strategy**. The player isn't told "build a Block deck" — they discover that Enforcers + Stack + Fortify creates an impenetrable territory playstyle. That moment of discovery is the dopamine hit.

---

### 4.9 The Gambit System

<!-- [ENGINE] — The Gambit is the high-risk/high-reward third option. This creates the memorable moments. -->

When a People Card triggers a binary choice (Reigns-style Left/Right), a third option appears on **critical decisions**: **The Gambit.**

```
> You played: 👤 Darius Webb

Darius wants a cut of the Woodlawn block.
Says he's earned it. You decide.

  ← [A] DENY — "He goes cold. Loyalty -2."
  → [B] GIVE CUT — "He stacks for you. +1 loyalty."
  🎲 [G] GAMBIT: DOUBLE DOWN — "Offer him the WHOLE block.
     If his hidden loyalty is ≥ 6, he swears a blood oath.
     +4 loyalty, Block keyword activates, permanent ally status.
     If his hidden loyalty is < 6... he takes it and flips.
     You lose Woodlawn AND Darius."

Your call? (A, B, or G)
```

#### Gambit Rules

| Rule | Detail |
|---|---|
| **When Gambits appear** | Every People Card decision has a 40% chance of offering a Gambit. Boss encounters always offer a Gambit. |
| **Gambit structure** | Always binary: massive upside vs. massive downside, gated by a **hidden stat check** the player doesn't know. |
| **Gambit cost** | Free Influence cost — but the consequence is irreversible. |
| **Information asymmetry** | The Gambit's success/failure depends on hidden stats. If the player has already Intel'd the character, they can make an informed Gambit. Otherwise, it's a read. |
| **Why it works** | Gambits create the stories players tell each other. "Dude, I Gambit'd the Enforcer and he flipped my whole block" or "I Gambit'd Tanya and she became my best card for the rest of the run." These are the viral moments. |

> **Design Note:** Gambits are the Balatro "boss blind" energy. They shouldn't appear every turn. When they do appear, the player should feel their pulse rise. The key insight: Gambits feel fair because the player *could have* used Intel first. If they didn't, they chose to gamble blind.

---

### 4.10 The Heat Meter

<!-- [ENGINE] — Global escalation pressure system. The walls always close in. -->

The Heat Meter is a **global, ever-increasing pressure system** that prevents turtling, forces aggressive play, and creates a sense of mounting dread across the campaign.

#### How Heat Works

| Component | Rule |
|---|---|
| **Heat starts at** | 0 at Level 1. Carries across levels within an Act. Resets at Act boundaries. |
| **Heat increases by** | +1 every turn (automatic). +1 per War played. +1 per territory lost. +2 per Police-type event triggered. |
| **Heat decreases by** | -1 per successful Peace alliance. -1 per Ghost move. -2 per level completed (completion bonus). |
| **Heat cap** | 20 per Act. At 20, permanent "Federal Indictment" event triggers (see below). |

#### Heat Thresholds — Permanent Modifiers

| Heat Level | Threshold | Global Modifier | Narrative Flavor |
|---|---|---|---|
| **Low Heat** | 0–4 | None. Streets are calm. | "Nobody's watching. Move freely." |
| **Warm** | 5–8 | All People Cards cost +1 Influence to play. | "Undercovers are multiplying. Every move gets noticed." |
| **Hot** | 9–13 | Rival factions coordinate — Street Whispers can target 2 blocks simultaneously. Status Cards shuffle into your deck every 2 turns. | "Corner boys are getting picked up. The block is paranoid." |
| **On Fire** | 14–17 | Intel Cards cost double. People Card loyalty decays by 1 per turn (people are scared). | "Everybody's a liability. One phone call from folding." |
| **Federal** | 18–20 | **Federal Indictment** — player has 3 turns to complete the level or auto-lose. Clock cannot be extended. | "The feds have the wiretap transcripts. Move NOW or it's over." |

> **Why Heat Works:** Heat is the anti-stalling mechanic. Without it, the optimal strategy is always "play defensively, gather information, make safe choices." Heat punishes passivity. The best players learn to ride the edge — generating enough Heat to be aggressive but not so much that it spirals.

---

### 4.11 The Ledger — Persistent Consequences

<!-- [ENGINE] — Cross-level memory system. Choices carry forward. -->

The Ledger is BL0CKS' answer to the question: **"Why should I care about what happened last level?"**

It tracks persistent state across the entire campaign run. The AI reads the Ledger at the start of each level and weaves it into narrative and mechanics.

#### What The Ledger Tracks

| Ledger Entry | Mechanical Effect | Narrative Effect |
|---|---|---|
| **Grudges** | If you Warred against a faction, their People Cards start with -2 visible loyalty in future levels. | NPCs reference the conflict. "Word on 79th is you hit the Lords hard. They remember." |
| **Debts** | If you chose "Give Cut" on a People Card, that character owes you. They appear in future levels with +2 loyalty and a bonus keyword. | "Darius kept his word. He's been talking you up on the block." |
| **Burned Bridges** | If you Exhausted a People Card, similar role/faction characters in future levels start with -1 loyalty. | "People heard what you did to Tanya. The informants don't trust you." |
| **Reputation** | Running tally of Territory Won vs. Lost across all levels. High rep → some NPCs auto-ally (loyalty starts 8+). Low rep → harsher events. | "Your name carries weight. People hear you're coming and they step aside." |
| **Ghost Status** | Ghosted territories may be claimed by rivals in interim. That rival now has a fortified position. | "Auburn Gresham went dark when you left. The Stones moved in." |
| **Body Count** | People Cards lost in War → Police-type events are more frequent. | "The feds are watching your war trail." |
| **Alliance History** | Honored Peace alliances → that faction offers better terms next time. Broken alliances → permanent enemy status. | "The Governors remember the peace you brokered at Hyde Park." |

#### Ledger Format (AI State Block)

```markdown
<!-- LEDGER — Persistent across campaign run -->
grudges:
  - faction: lords, origin: level_03, severity: high
debts:
  - character: darius_webb, origin: level_02, type: gave_cut, bonus_keyword: rally
burned:
  - role: informant, count: 2, loyalty_penalty: -2
reputation: +4 (7 won, 3 lost)
ghost_territories: [auburn_gresham]
body_count: 3
alliances:
  - faction: governors, status: honored, levels_held: 2
heat_carried: 6
assets_held: [greek_diner, corner_armory, og_status]
<!-- END LEDGER -->
```

> **Why The Ledger Works:** It transforms BL0CKS from "12 disconnected puzzles" into a single, consequences-matter campaign. When a player says "I can't Burn Marcus because I already Burned two informants and my rep with that role is tanked," that's emergent strategy from persistent state. It's also the "one more level" hook — the player wants to see how their choices from Level 3 play out in Level 7.

---

## 5. Level Design & Difficulty Curve

### 5.1 Arc Structure

<!-- [ENGINE] — Act structure and info density curve are fixed. Level content is [TEMPLATE]. -->

| Act | Levels | Design Intent | Info Density | Intel Cards | Base Influence | Heat at Start | Stash Rewards |
|---|---|---|---|---|---|---|---|
| ACT I: The Corner | 1–4 | Learn the rules. Trust is cheap. Influence feels abundant. | 80% visible | 4 per level | 3 | 0 (fresh) | After Levels 2, 3, 4 |
| ACT II: The Board | 5–9 | Alliances fracture. Influence feels tight. Heat builds. Keywords become essential. | 50% visible | 2 per level | 3 (or 4 w/ OG Status) | Carries from Act I | After Levels 5, 6, 7, 8 |
| ACT III: The Commission | 10–12 | Single-player survival. Trust no one. Every Influence point is life or death. | 20% visible | 0–1 per level | 3 (Assets are your lifeline) | Carries from Act II | After Levels 10, 11 |

#### Boss Encounters

<!-- [ENGINE] — Boss encounters break the standard turn rhythm. They are the "set piece" moments. -->

Every Act ends with a **Boss Level** — a modified level with unique rules:

| Boss Level | Boss Mechanic | Special Rule | Gambit Always Available |
|---|---|---|---|
| **Level 4: The First Test** | A high-loyalty Informant offers to flip. Their hidden stats are completely unknown. | Player must make a Gambit decision with 0 Intel available. Success = bonus Asset. Failure = lose 1 territory. | Yes |
| **Level 9: The Broker's Table** | Three factions simultaneously present alliance offers. Player can only accept 1. The other 2 become permanent enemies. | All 3 offers have hidden consequences that only resolve in Act III. The Ledger records all three outcomes. | Yes |
| **Level 12: The Commission** | The player faces *every* faction simultaneously. Hidden stats are at 20% visible. No Street Whispers — intents are hidden. | Pure survival. The player's Asset collection and Ledger state determine whether this is beatable. Heat starts at 12. | Yes — every decision |

> **Design Rule:** Boss Levels should feel like the final exam for the skills taught in that Act. Act I teaches basic card play → the boss tests blind trust. Act II teaches alliances and keywords → the boss tests strategic commitment. Act III tests everything simultaneously.

### 5.2 Level Markdown Architecture

<!-- [ENGINE] — File format is fixed. Frontmatter keys are the contract. Content is [TEMPLATE]. -->

Each level is defined by a single Markdown file. The AI reads this file at level load and parameterizes the entire session from it.

**File naming convention:** `level_[NN]_[slug].md`

**Example — `level_05_woodlawn_fracture.md`:**

```markdown
---
level: 05
title: "Woodlawn Fracture"
territory: woodlawn
act: 2
hidden_ratio: 0.5
intel_cards_available: 2
clock_pressure: high
starting_blocks: 2
base_influence: 3
influence_modifier: 0
heat_starting: 6
heat_per_turn: 1
stash_reward_on_complete: true
stash_pool_tier: "act_2"
boss_encounter: false
keywords_available: [block, connect, flip, hustle, fortify, shadow, rally]
win_condition: control_3_blocks_without_war
loss_condition: loyalty_below_3_on_any_held_block
narrative_seed: alliance_collapse
faction_event: governors_power_vacuum_triggered
npc_count: 6
npc_betrayal_floor: 0.3
gambit_chance: 0.4
secret_arc_unlock: false
difficulty_gate: cloud_resolved
ledger_effects:
  - grudge_lords_applies: true
  - debts_carry_forward: true
---

## Narrative Premise

The Governors just lost their top lieutenant at 67th and Stony Island.
Nobody knows who gave the order. Everyone has a theory.
You have four blocks and six people who may or may not still be your people.
Your Heat is already at 6 from the war in Act I. The block is tense.

## Win Flavor Text

"You read the room before the room read you. Woodlawn holds — for now."

## Loss Flavor Text

"Trusted the wrong face. The block is gone before you even knew it moved."

## Special Rules

- Any War card played in this level has a 40% chance of triggering a Police Raid event (+2 Heat)
- The Snitch move costs 3 clock ticks instead of 2 (heat is high)
- One NPC in this level has a hidden Commission allegiance (AI assigns at session start)
- If Ledger shows grudge against Lords: Lords NPCs start with -2 loyalty
- If Ledger shows debt from Darius Webb: Darius appears with +2 loyalty and Rally keyword
```

### 5.3 Difficulty Scaling Rules

<!-- [CLOUD] — Difficulty gating is server-enforced. Local files suggest, cloud enforces. -->

Difficulty is **cloud-resolved**, not locally determined. The JWT payload returned at session start includes a `difficulty_gate` field. Local Markdown files **cannot override** this value.

| Difficulty Lever | Local MD Controls | Cloud Controls |
|---|---|---|
| Narrative flavor | Yes | No |
| NPC name + faction | Yes | No |
| Hidden ratio | Suggests | Enforces |
| Intel card count | Suggests | Enforces |
| Betrayal floor | Suggests | Enforces |
| Clock pressure multiplier | No | Yes |
| Win/loss condition logic | No | Yes |

---

## 6. AI Architecture & Multi-Model System

<!-- [ENGINE] — Model routing is core infrastructure. Adapter files are [TEMPLATE]-ish — 
     add new adapters for new providers without modifying the router. -->

### 6.1 Model Router

BL0CKS routes all AI calls through a provider-specific adapter based on the player's API key. Each adapter `.md` file defines prompt formatting, token strategy, and capability flags for that model.

```
/engine/adapters/
  claude.md       ← extended thinking, nuanced deception modeling
  gemini.md       ← long context, multi-NPC state tracking
  gpt4o.md        ← reliable baseline, tool use for structured output
  mistral.md      ← silver tier, reduced NPC depth
  llama3.md       ← free tier, local execution
  ollama.md       ← fully offline fallback
```

### 6.2 Model Capability Tiers

<!-- [ENGINE] — Tier definitions are fixed. Provider assignments are [TEMPLATE]. -->

| Tier | Models | Narrative Depth | Generative Art | Dynamic Music | NPC Hidden Stats |
|---|---|---|---|---|---|
| Platinum | Claude Opus, GPT-4o, Gemini Ultra | Full — emergent betrayal arcs | Per session, per card | Territory-reactive | Full hidden layer |
| Gold | Claude Sonnet, Gemini Pro, GPT-4 Turbo | Full | Templated library | Static per territory | Full hidden layer |
| Silver | Mistral, Cohere, Groq | Reduced | Templated library | Static | Partial — 3 of 6 stats hidden |
| Free | Ollama, LLaMA, Mistral local | Pre-generated | Static art packs | None | Pre-assigned, no generation |

### 6.3 Edition System

<!-- [TEMPLATE] — Edition names, colors, and exclusive content are fully swappable per provider deal. -->

| Edition | API Key Trigger | Exclusive Content | Visual Treatment | Provider Value |
|---|---|---|---|---|
| Claude Edition | `sk-ant-` prefix | Deception Arc — 3 exclusive levels | Purple + gold animated cards | API acquisition channel |
| Gemini Edition | `AIza` prefix | The Wire DLC pack | Prismatic holographic cards | Long-context showcase |
| GPT Edition | `sk-` prefix (OpenAI) | Informant mechanic unlock | Minimal white + green | Developer mindshare |
| Community Edition | Local / free model | Community cards only | Street art graffiti style | OSS goodwill |

### 6.4 Cloud Validation Architecture

<!-- [CLOUD] — This entire flow is server-side. JWT structure is the contract. -->

```
[Player enters API key]
        ↓
POST /api/validate-edition  {key: [redacted]}
        ↓
Server-side key pattern match → identify provider
        ↓
Return signed JWT {
  edition: "claude",
  tier: "platinum",
  dlc_unlocked: ["base", "deception_arc"],
  difficulty_gate: { hidden_ratio_max: 0.8, intel_floor: 0 },
  session_fingerprint: "[hash]",
  exp: [24hr TTL]
}
        ↓
Game engine reads JWT only — local files cannot override
        ↓
DLC packs stream from CDN gated by JWT scope
```

**What local Markdown files CAN control:**
- Card flavor text and character names
- Narrative premise and win/loss flavor
- Visual theme overrides within allowed palette
- Community card imports (non-gated)

**What local Markdown files CANNOT control:**
- Edition assignment
- Difficulty gate values
- DLC content access
- NFT minting triggers

---

## 7. Card Creation Engine

<!-- [ENGINE] — The creation flow and template format are core engine.
     World-specific field values (roles, factions, territories) are [TEMPLATE]. -->

### 7.1 Overview

The Card Creation Engine is the **platform differentiator** — it transforms BL0CKS from a game into a game factory. Any player can describe a card in natural language and the AI autofills a complete, playable card with hidden stats, art prompt, and decision logic.

Requires API key. This is the primary driver of API-key-gated engagement.

### 7.2 Creation Flow

```
1. Player opens Engine tab
2. Selects card type (People / Event / Block / Move)
3. Types natural language description
   → "A snitch who used to run with the Governors
      but flipped after his brother got shot on 71st"
4. AI generates:
   - Visible stats (loyalty, role, affiliation)
   - Hidden motive and betrayal trigger
   - Three decision scenario scripts
   - Art generation prompt
   - Consequence chain (2 levels deep)
5. Player reviews in card preview panel
6. Edits any field directly
7. Approves → saved to /cards/custom/[id].md
8. Optional: bundle into Pack → submit to Community Registry
9. Pack Origin NFT mints on submission
```

### 7.3 Card Template Files

<!-- [TEMPLATE] — Field names are [ENGINE]. Field VALUES (roles, factions, etc.) are swappable. -->

```markdown
<!-- /cards/templates/people_card.md -->
---
id: [auto-generated uuid]
type: people
version: 1.0
---

## Visible Layer
name: [AI fills]
role: [Enforcer | Broker | Informant | Runner]
faction: [AI fills from world context]
block: [AI fills from territory list]
loyalty_visible: [AI fills 0-10]

## Hidden Layer (AI-generated, never shown without Intel Card)
loyalty_hidden: [AI fills — may differ from visible]
true_motive: [AI fills — 1-2 sentences]
flip_trigger: [AI fills — condition string]
betrayal_threshold: [AI fills 0-10]
secret_allegiance: [AI fills — may differ from faction badge]

## Decision Scripts
scenario_1:
  trigger: [condition]
  player_prompt: "[what player sees]"
  left_outcome: "[consequence]"
  right_outcome: "[consequence]"

scenario_2: ...
scenario_3: ...

## Art
art_prompt: [AI fills — style-consistent illustration prompt]
art_style: lo-fi portrait, street photography filter, South Side Chicago

## Metadata
created_by: [player_id]
edition: [detected from JWT]
community_submitted: false
upvotes: 0
```

### 7.4 Forkability — The Platform Play

<!-- [TEMPLATE] — This table IS the fork guide. Add your own variant rows. -->

The entire world layer is designed to be swapped wholesale:

| Fork Variant | Swap These Files | Same Mechanic Engine |
|---|---|---|
| East Oakland Edition | `territories.md`, `factions.md`, character templates | Yes — identical |
| Corporate Espionage | `territories.md` (offices), `factions.md` (corps), move card names | Yes |
| Prison Politics | `territories.md` (wings), resource names, faction names | Yes |
| Medieval Court | Full world files, faction names, art style prompt | Yes |

The OSS license on the engine **explicitly encourages forks.** Community variants drive discovery back to the base game.

---

## 8. DLC System

<!-- [ENGINE] — Delivery pipeline is fixed. Pack types and pricing are [TEMPLATE]. -->

### 8.1 DLC Types

| Type | Description | Source | Gating | Price |
|---|---|---|---|---|
| Edition DLC | Exclusive arc funded by AI provider | Provider-licensed | JWT edition check | Free w/ edition |
| Story Packs | New territory arcs — Oakland, Bronx, Marseille | Studio | One-time purchase | $4.99–$9.99 |
| Character Packs | New People card sets with unique mechanics | Community + Studio | Purchase or upvote | $1.99–$3.99 |
| Mechanic DLC | New card types — Lawyer, Politician, Fed | Studio | Season pass | Included in pass |
| Seasonal Events | Time-limited scenarios | Studio | Free — time-gated | Free |
| Community Packs | Player-created, upvote-curated | Community | Free — all tiers | Free |

### 8.2 DLC Delivery Pipeline

<!-- [CLOUD] — CDN delivery and JWT gating are server-side infrastructure. -->

```
Player clicks "Add Pack" in Library tab
        ↓
JWT checked for scope → allowed pack list returned
        ↓
Pack manifest requested from CDN
  /dlc/packs/[pack_id]/manifest.json
        ↓
Manifest includes: card list, art assets, level files, audio
        ↓
Pack streamed → locally cached in /dlc/installed/[pack_id]/
        ↓
Cards become available in deck builder + card table immediately
```

---

## 9. NFT Achievement System

<!-- [ENGINE] — Achievement tiers and minting flow are core. 
     Visual treatments and chain selection are [TEMPLATE]. 
     Minting infrastructure is [CLOUD]. -->

*NFTs here are digital plaques. Not investments. Not speculation. Provable, permanent proof that you did the work.*

### 9.1 Achievement Tiers — The Plaque System

| Plaque | Unlock Trigger | Visual Treatment | Supply | Chain |
|---|---|---|---|---|
| Corner Boy | Complete Level 1 | Animated street corner card | Unlimited | Base |
| Block Runner | Complete all 12 base levels | Territory map, player ID burned in | Unlimited | Base |
| OG | Complete all levels + secret arc | Gold-foil animated card | 10,000 max | Base |
| Architect | Publish a card pack via Engine | Blueprint-style, pack name inscribed | Unlimited | Base |
| The Commission | Pack hits 1,000 upvotes | Council table card, named seat | 1,000 max | Base |
| Legend | Pack hits 10,000 downloads | Diamond-foil animated card | 100 max | Base |
| Goat | Pack hits 100,000 downloads | 1-of-1 custom illustrated, co-designed | 1 of 1 | Base |

### 9.2 Minting Architecture

<!-- [CLOUD] — Entire minting pipeline is server-side. -->

```
Achievement condition met (server-verified)
        ↓
POST /api/mint-achievement {
  player_id, achievement_id, session_fingerprint, wallet_address
}
        ↓
Server verifies session fingerprint against achievement log
        ↓
Minting call sent from BL0CKS cloud wallet → smart contract
        ↓
NFT minted on Base (Coinbase L2)
        ↓
Metadata uploaded to IPFS: {
  name, description, image (animated),
  attributes: [
    { trait: "Achievement", value: "Block Runner" },
    { trait: "Edition", value: "Claude Edition" },
    { trait: "Territory", value: "Englewood" },
    { trait: "Levels Completed", value: 12 },
    { trait: "Season", value: "Season 1" }
  ]
}
        ↓
Player receives NFT in wallet + in-game badge displayed
```

### 9.3 Pack Origin NFT

When a creator publishes a card pack:
- **Pack Origin NFT** mints automatically — provable on-chain authorship
- As pack earns downloads, **milestone NFTs** auto-mint (100 / 1k / 10k / 100k)
- Secondary market trades on Pack Origin NFT trigger **10% royalty** to creator
- Early collectors of a pack can mint a **"First 100" collector NFT**

### 9.4 Edition NFT Visual Treatments

<!-- [TEMPLATE] — Visual treatments per edition are swappable. -->

| Edition | Art Style | Color Treatment | Motion |
|---|---|---|---|
| Claude Edition | Illustrated portrait, cinematic | Purple + gold | Shimmer loop |
| Gemini Edition | Geometric abstract | Prismatic holographic | Prism rotate |
| GPT Edition | Minimal flat design | White + green | Pulse |
| Community Edition | Street art / graffiti | High-contrast + tag textures | Spray paint reveal |

---

## 10. Community Systems

### 10.1 Upvote Engine

<!-- [ENGINE] — Thresholds and reward triggers are core. Reward content is [TEMPLATE]. -->

| Threshold | Reward | NFT Impact |
|---|---|---|
| 50 upvotes | Listed in Community Registry — searchable in-game | None |
| 250 upvotes | Featured on New Bl0cks discovery screen | None |
| 1,000 upvotes | Bundled as optional DLC in base game update | The Commission NFT mints to creator |
| 5,000 upvotes | Eligible for paid pack listing with 70% rev share | None additional |
| 10,000 downloads | Legend NFT auto-mints to creator | Legend NFT |
| 100,000 downloads | Goat NFT auto-mints, co-design session scheduled | Goat NFT (1-of-1) |

### 10.2 Anti-Gaming

<!-- [ENGINE] — Anti-abuse mechanics are non-negotiable. -->

- Upvotes tied to verified game sessions — minimum 3 completed levels to vote
- Platinum tier votes count 2x
- AI moderation pass on all submitted cards before community listing
- Pack Origin NFT minted on submission — deters spam submissions
- Rate limiting: max 5 card pack submissions per player per 30-day period

---

## 11. Monetization Architecture

<!-- [ENGINE] — Revenue stream categories are fixed. Prices and terms are [TEMPLATE]. -->

| Revenue Stream | Mechanism | Timing |
|---|---|---|
| Edition Licensing | AI providers pay per-season for co-branded exclusivity | Pre-launch |
| DLC Pack Sales | One-time purchase — 70% to creator / 100% studio first-party | Post-launch |
| NFT Primary Minting | Small fee on OG tier and above (~$2–5) | With achievement system |
| NFT Secondary Royalties | 10% on all secondary trades — ERC-2981 on Base | Ongoing |
| Pack Origin Royalties | 10% when Pack Origin NFTs trade | Ongoing |
| Hosted App Subscription | Rate-limited SSO tier — $4.99/month | Launch |
| Season Pass | Mechanic DLC + seasonal events bundle | Per season |
| Creator Marketplace | Commission on premium pack sales | Phase 5 |

> **Provider Pitch:** BL0CKS delivers high-intent API activations to a dev-adjacent audience. Every player's first action is entering an API key. The audience skews toward developers and early adopters — exactly the users providers want to acquire. A co-branded Edition exclusive arc is a measurable API acquisition channel dressed as a game.

---

## 12. UI/UX Requirements — Mobile-First

<!-- [ENGINE] — Layout zones, interaction states, and gesture specs are fixed.
     Colors, typography, and visual tokens are [TEMPLATE] — swappable via theme.json. -->

> All specs are **mobile portrait (390 × 844px — iPhone 14 baseline)** unless noted.
> All measurements in **px**. All interaction states must be designed:
> **Default · Hover/Focus · Pressed · Disabled · Loading · Error · Success**

---

### 12.1 Design System & Tokens

<!-- [TEMPLATE] — All token values below are swappable. Token NAMES are [ENGINE]. -->

#### Color Tokens

```
--color-bg-base:          #0D0D0D   /* Near-black canvas */
--color-bg-surface:       #1A1A2E   /* Card surface, panels */
--color-bg-elevated:      #252542   /* Modals, drawers */
--color-accent-red:       #C0392B   /* Primary CTA, faction red */
--color-accent-gold:      #D4AC0D   /* Achievement, highlights */
--color-accent-blue:      #1F4E79   /* Governors faction */
--color-text-primary:     #F2F2F2   /* Body copy */
--color-text-secondary:   #888888   /* Muted labels */
--color-text-disabled:    #444444   /* Disabled state */
--color-border:           #2E2E4A   /* Subtle borders */
--color-border-accent:    #C0392B   /* Focused/active borders */
--color-success:          #27AE60
--color-error:            #E74C3C
--color-warning:          #F39C12
```

#### Typography Scale

```
--font-family:   "Space Grotesk", sans-serif
--font-mono:     "Space Mono", monospace   /* Card IDs, code blocks */

--text-xs:    11px / 16px  — labels, badges
--text-sm:    13px / 18px  — supporting copy
--text-base:  15px / 22px  — body
--text-md:    17px / 24px  — card names, field labels
--text-lg:    20px / 28px  — section headers
--text-xl:    24px / 32px  — screen titles
--text-2xl:   32px / 40px  — hero text
--text-3xl:   48px / 56px  — splash / cover
```

#### Spacing Scale (8px grid)

```
--space-1:   4px    --space-6:   24px
--space-2:   8px    --space-8:   32px
--space-3:   12px   --space-10:  40px
--space-4:   16px   --space-12:  48px
--space-5:   20px   --space-16:  64px
```

#### Elevation & Shadows

```
--shadow-card:       0 4px 16px rgba(0,0,0,0.6)
--shadow-modal:      0 8px 40px rgba(0,0,0,0.8)
--shadow-glow-red:   0 0 20px rgba(192,57,43,0.4)
--shadow-glow-gold:  0 0 20px rgba(212,172,13,0.4)
```

#### Motion Tokens

```
--duration-fast:    120ms
--duration-base:    240ms
--duration-slow:    400ms
--duration-crawl:   800ms
--ease-snap:        cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-card-flip:   cubic-bezier(0.68, -0.55, 0.27, 1.55)
```

---

### 12.2 Onboarding & API Key Entry Flow

<!-- [ENGINE] — Screen flow order and validation logic are fixed. 
     Copy, provider names, and visual treatments are [TEMPLATE]. -->

#### Screen 1 — Splash / Cover

**Viewport:** 390 × 844px, full bleed.

```
┌───────────────────────────────────────┐
│                                       │  bg: #0D0D0D
│   [ANIMATED STREET GRID TEXTURE]      │  South Side map overlay
│   full bleed, 0.3 opacity             │  slow pan-right, 0.3px/frame
│                                       │
│         B L O C K S                  │  64px bold #F2F2F2, centered
│                                       │  letter-by-letter reveal
│   Territory. Trust. Time.            │  17px italic #888888, centered
│                                       │
│  ┌─────────────────────────────────┐  │  Primary CTA
│  │        ENTER THE BLOCK          │  │  h: 56px, full width minus 32px margin
│  └─────────────────────────────────┘  │  bg: #C0392B, text: #F2F2F2 17px bold
│  ┌─────────────────────────────────┐  │  Secondary CTA
│  │         VIEW COMMUNITY          │  │  h: 48px, border: 1px #888888
│  └─────────────────────────────────┘  │  text: #888888, 15px
│   South Side, Chicago  ·  Season 1   │  11px #444444, centered, bottom-16px
└───────────────────────────────────────┘
```

**States:**
- Default: as above
- Returning user with valid session JWT: skip directly to Card Table
- Returning user with expired JWT: show "Session expired — re-enter key" banner (44px, #F39C12 bg)

#### Screen 2 — Provider Selection

```
┌───────────────────────────────────────┐
│  ← Back                               │  44×44px tap target
│  Choose Your Model                    │  24px bold #F2F2F2
│  Your API key unlocks your edition.   │  13px #888888
│  ┌─────────────────────────────────┐  │  Provider tile — h: 72px
│  │  [Logo 32px]  ANTHROPIC          │  │  bg: #1A1A2E
│  │               Claude Edition     │  │  border: 1px #2E2E4A (default)
│  │               Platinum · ★ Excl  │  │  border: 1px #C0392B (selected)
│  └─────────────────────────────────┘  │  left accent bar: 3px #C0392B (selected)
│  ┌─────────────────────────────────┐  │
│  │  [Logo]  GOOGLE (GEMINI)         │  │
│  │          Gemini Edition · ★      │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  [Logo]  OPENAI (GPT-4o)         │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  [Logo]  OTHER / OPEN SOURCE     │  │
│  │          Community · No key req. │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │  Disabled until tile selected
│  │            CONTINUE              │  │  disabled: bg #2E2E4A text #444444
│  └─────────────────────────────────┘  │  enabled: bg #C0392B text #F2F2F2
└───────────────────────────────────────┘
```

#### Screen 3 — API Key Entry

```
┌───────────────────────────────────────┐
│  ← Back                [PROVIDER LOGO]│
│  Enter Your API Key                   │  24px bold
│  Validated server-side.               │  13px #888888
│  Never stored locally.                │
│  [PROVIDER] API KEY                   │  11px #888888, label above input
│  ┌─────────────────────────────────┐  │  Input field: h 56px, bg #1A1A2E
│  │  [Placeholder format]   [show]  │  │  border: 1px #2E2E4A (default)
│  └─────────────────────────────────┘  │  border: 1px #C0392B (focused) + glow
│  ⓘ [Helper validation text]          │  border: 1px #27AE60 (valid format)
│    Don't have one? Get it here →      │  border: 1px #E74C3C (error)
│  ┌─────────────────────────────────┐  │
│  │          VALIDATE KEY           │  │  56px h, full width -32px margin
│  └─────────────────────────────────┘  │  disabled when field empty
│  ─────────  OR  ─────────            │  divider: 1px #2E2E4A, OR centered
│  ┌─────────────────────────────────┐  │
│  │  🔒  Sign in with [Provider]    │  │  SSO option: 56px h
│  └─────────────────────────────────┘  │  border: 1px #2E2E4A, 15px #F2F2F2
│   Subscription covers API costs       │  11px #888888 centered, bottom
└───────────────────────────────────────┘
```

**Dynamic formatting by provider:**

| Provider | Placeholder format | Helper validation text | Validation logic |
|---|---|---|---|
| **Anthropic** | `sk-ant-••••••••••••••` | "Keys start with sk-ant-" | `startsWith('sk-ant-')` |
| **Gemini** | `AIza•••••••••••••••••` | "Keys start with AIza" | `startsWith('AIza')` |
| **OpenAI** | `sk-proj-•••••••••••••` | "Keys start with sk-" | `startsWith('sk-')` |

**Input interaction states:**

| State | Border Color | Button | Helper Text |
|---|---|---|---|
| Default (empty) | `#2E2E4A` | Disabled | [Helper validation text] |
| Focused | `#C0392B` + glow | Active if length > 20 | — |
| Valid format | `#27AE60` | Active, red | Green check + "Looks good" |
| Validating | `#C0392B` pulse | Spinner + "Checking…" | "Checking with server…" |
| Error | `#E74C3C` | Re-enabled | Error message (see below) |
| Success | `#27AE60` | → transitions to Screen 4 | — |

**Error message copy by code:**

| Error Code | Message Displayed |
|---|---|
| `INVALID_KEY_FORMAT` | "That key format doesn't look right. [Provider] keys start with [Prefix]." |
| `KEY_REVOKED` | "This key has been revoked. Generate a new one in your API console." |
| `RATE_LIMITED` | "Too many attempts. Wait 60 seconds and try again." |
| `SERVER_ERROR` | "Something went wrong on our end. Try again in a moment." |

#### Screen 4 — Edition Reveal

**Purpose:** Cinematic unlock moment. Equivalent energy to unboxing a game edition.

```
┌───────────────────────────────────────┐
│                                       │  bg: #0D0D0D, full bleed
│      [ANIMATED EDITION CARD]          │  Card: 300×420px centered
│      300 × 420px                      │  Face-down → flip on entry
│      Card flip plays on entry         │  Flip animation: 800ms --ease-card-flip
│      Purple/gold art (Claude ed.)     │
│   CLAUDE EDITION                      │  32px bold #F2F2F2, fades after flip
│   Platinum Tier  ·  Season 1          │  15px #888888, fades 120ms after title
│   ✦  Deception Arc unlocked           │  Items appear 1-by-1, 200ms stagger
│   ✦  12 base levels unlocked          │  Color: #D4AC0D, 15px
│   ✦  Card Creation Engine unlocked    │
│   ✦  NFT plaques active               │
│  ┌─────────────────────────────────┐  │  Appears after list completes
│  │        ENTER THE BLOCK          │  │  fade in 400ms
│  └─────────────────────────────────┘  │  56px, #C0392B
└───────────────────────────────────────┘
```

**Full animation sequence (~2.4s total):**

| Time | Event |
|---|---|
| 0ms | Black screen, card face-down visible |
| 200ms | Card flip begins (800ms duration) |
| 1000ms | Edition name fades in (240ms) |
| 1240ms | Tier line fades in (240ms) |
| 1480ms | Unlock items appear (200ms stagger × 4 = 800ms) |
| 2280ms | CTA button fades in (400ms) |

#### Screen 5 — Wallet Connection (Optional)

**Note:** Explicitly optional. "Skip for now" must be immediately visible.

```
┌───────────────────────────────────────┐
│                         Skip for now  │  15px #888888, top-right
│  Claim Your Achievements              │  24px bold
│  Connect a wallet to receive NFT      │  13px #888888, 2 lines
│  plaques when you complete levels.    │
│  [3 STACKED CARD PREVIEWS]            │  Cards fan on entry (bounce ease)
│  120×168px each, 20px offset          │  "Corner Boy" "Block Runner" "OG"
│  ┌─────────────────────────────────┐  │  Wallet tile: h 64px
│  │  [◈ logo]  Coinbase Wallet      │  │  bg: #1A1A2E, border: 1px #2E2E4A
│  │            RECOMMENDED          │  │  Badge: 11px #D4AC0D bg #1F0D00
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  [◈ logo]  MetaMask             │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  [◈ logo]  WalletConnect        │  │
│  └─────────────────────────────────┘  │
│  No wallet? Create one in 60 sec →   │  13px, link to Coinbase onboarding
│  ┌─────────────────────────────────┐  │
│  │         CONNECT WALLET          │  │  56px, #C0392B
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

---

### 12.3 Core Gameplay — Card Table

<!-- [ENGINE] — Layout zones and gesture specs are fixed. Visual tokens and copy are [TEMPLATE]. -->

#### Global Navigation Bar

**Height:** 56px. Persistent across all gameplay screens.

```
┌───────────────────────────────────────┐
│  [≡]  BL0CKS   Woodlawn · Lv 5   [●] │
│       [MAP]      [CLOCK]   [PROFILE]  │
└───────────────────────────────────────┘
```

- Hamburger menu: 44×44px tap target, opens side drawer (faction status, settings, pack library)
- Territory + level indicator: centered, 13px #888888
- Profile dot: 44×44px, shows edition badge color (purple = Claude, prismatic = Gemini, etc.)

#### Full Card Table Layout

**Viewport:** 390 × 844px. Divided into 5 vertical zones.

```
┌───────────────────────────────────────┐  ← 390 × 844px
│  [≡]  BL0CKS   Woodlawn · Lv 5   [●] │  Zone 1: Nav — 56px
├───────────────────────────────────────┤
│  ┌─────────────────────────────────┐  │  Zone 2: Event Ticker — 44px
│  │  POLICE SCANNER   ● ACTIVE      │  │  bg: #1A1A2E
│  │  "71st & Cottage — units moving"│  │  Red dot pulses when active
│  └─────────────────────────────────┘  │  Text scrolls horizontally if long
├───────────────────────────────────────┤
│  CLOCK  ████████░░░  [00:18]  ⚠       │  Zone 3: Clock Bar — 32px
│  ← 8 ticks remaining                  │  Green > 50%, Orange 30–50%, Red < 30%
├───────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐        │  Zone 4: Territory Map — 280px
│  │ WOOD │  │ ENGL │  │ ROSE │        │  6 neighborhood blocks as SVG grid
│  │  ●   │  │  ○   │  │  ◑   │        │  ● = player controls (faction color)
│  └──────┘  └──────┘  └──────┘        │  ○ = rival controls (rival color)
│  ┌──────┐  ┌──────┐  ┌──────┐        │  ◑ = contested (striped animation)
│  │ CHAT │  │ HYDE │  │ AUBU │        │  Tap a block → Block Card detail panel
│  │  ○   │  │  ◐   │  │  ●   │        │  slides up (240ms ease)
│  └──────┘  └──────┘  └──────┘        │
├───────────────────────────────────────┤
│  ┌─────────────────────────────────┐  │  Zone 4b: Active Event Card — 96px
│  │  EVENT:  POWER VACUUM           │  │  bg: #252542
│  │  Governors lost their top man.  │  │  border-left: 3px #C0392B
│  │  Choose how to move.      [▸]   │  │  Tap [▸] → full event detail modal
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│  YOUR HAND      [3 People] [2 Move]   │  Zone 5: Hand Tray — 160px + action bar
│  ← swipe →  [card] [card] [card]  → │  Horizontal scroll, no pagination dots
│             [card] [card]             │  Tray card size: 100×140px
│                                       │  Active card: 3px #D4AC0D border + lift
├───────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────────┐  │  Action Bar — 72px
│  │  INTEL   │  │   PLAY CARD  →   │  │  Intel: 100px w, border 1px #2E2E4A
│  │  2 left  │  │                  │  │  Play Card: flex-fill, bg #C0392B
│  └──────────┘  └──────────────────┘  │  Disabled when no card selected
└───────────────────────────────────────┘
```

#### People Card Detail Modal

Triggered by tapping a card in hand tray or on territory map. Slides up from bottom.

```
┌───────────────────────────────────────┐
│                                       │  Overlay: rgba(0,0,0,0.7) backdrop
│  ┌────────────────────────────────┐   │
│  │  ─── [drag handle 32px wide]  │   │  Modal: h 640px, slides up 400ms
│  │                                │   │  bg: #1A1A2E
│  │  [AI CARD ILLUSTRATION]        │   │  border-radius: 16px 16px 0 0
│  │  343 × 200px, full width       │   │  shadow: --shadow-modal
│  │  DARIUS WEBB              [GD] │   │  Name: 20px bold #F2F2F2
│  │  Broker  ·  Woodlawn           │   │  Sub: 13px #888888
│  │  LOYALTY  ████████░░   8/10    │   │  Progress bar: h 28px, #C0392B fill
│  │  ┌──────────────────────────┐  │   │  Visible Stats block
│  │  │  VISIBLE STATS           │  │   │  bg: #252542, border-radius 8px
│  │  │  Role      Broker        │  │   │  padding: 16px
│  │  │  Block     Woodlawn      │  │   │
│  │  │  Faction   Governors     │  │   │
│  │  │  Status    Active        │  │   │
│  │  └──────────────────────────┘  │   │
│  │  ┌──────────────────────────┐  │   │  Hidden Stats — LOCKED state
│  │  │  🔒  HIDDEN STATS        │  │   │  bg: #0D0D0D
│  │  │  Spend 1 Intel Card      │  │   │  border: 1px dashed #444444
│  │  │  to reveal true motive.  │  │   │
│  │  │  [REVEAL — 1 Intel]      │  │   │  CTA text: 15px #D4AC0D
│  │  └──────────────────────────┘  │   │
│  │  ┌──────────┐  ┌────────────┐  │   │  Action row: 56px h
│  │  │  GHOST   │  │  PLAY  →   │  │   │  Ghost: secondary, border 1px #888888
│  │  └──────────┘  └────────────┘  │   │  Play: primary, bg #C0392B
│  └────────────────────────────────┘   │
└───────────────────────────────────────┘
```

**Gesture spec for modal:**
- Drag handle or downward swipe >120px → dismiss with spring animation (240ms ease-bounce)
- Backdrop tap → dismiss
- Swipe left/right within modal → cycle to next/previous card in hand

#### Reigns-Style Decision Overlay

Triggered after a Move Card is played or Event Card forces a choice.

```
┌───────────────────────────────────────┐
│                                       │  Backdrop: blurred card table behind
│  ← DENY              GIVE CUT →       │  blur: 8px, rgba(0,0,0,0.5) overlay
│    text: #C0392B       text: #27AE60  │  Hint labels: 13px
│  ┌───────────────────────────────┐    │  Left: fade in from left, red
│  │  [CARD ILLUSTRATION]          │    │  Right: fade in from right, green
│  │  300 × 180px art              │    │  Decision card: 300×420px
│  │  "Darius wants a cut of the   │    │  bg: #1A1A2E, shadow: --shadow-modal
│  │  Woodlawn block. Says he's    │    │  Prompt text: 15px #F2F2F2
│  │  earned it. You decide."      │    │  centered, padding 16px
│  └───────────────────────────────┘    │
│  ← "He goes cold. Loyalty -2."       │  Left consequence preview
│  "He stacks for you. +1 loy." →      │  Right consequence preview
└───────────────────────────────────────┘
```

**Drag gesture spec:**

| Gesture | Behavior |
|---|---|
| Drag horizontal | Card follows finger at 0.8x ratio, rotates max 15° |
| < 40% threshold released | Snap back to center, 240ms --ease-bounce |
| > 40% threshold released | Card flies off in drag direction, 200ms |
| Left confirm | Card exits left → consequence resolves |
| Right confirm | Card exits right → consequence resolves |

#### Consequence Cascade Animation Sequence

```
[Decision card flies off]          200ms
        ↓
[Territory map: affected block flashes]
  Controlled → flash faction color → settle     400ms
  Contested → shimmer loop                      400ms
        ↓
[People Cards in hand: loyalty change badges]
  +N loyalty: green badge slides from card edge  160ms in, 600ms hold, fade
  -N loyalty: red badge, card shake animation    200ms shake, 600ms hold, fade
        ↓
[Clock bar: consumed ticks animate]
  Bar shrinks from right, 240ms per tick consumed
        ↓
[New Event Card if triggered]
  Slides down from ticker zone, 320ms ease
  border-left pulses red (3px, 2 pulses)
```

---

### 12.4 Card Creation Engine UI

<!-- [ENGINE] — Layout and generation flow are fixed. Field labels and card types are [TEMPLATE]. -->

#### Screen 1 — Engine Entry

Accessed via "ENGINE" tab in bottom nav. Requires valid JWT (API key validated).

```
┌───────────────────────────────────────┐
│  [≡]  CARD ENGINE               [?]  │  56px nav, [?] opens help sheet
├───────────────────────────────────────┤
│  What are you building?               │  24px bold #F2F2F2
│  ┌─────────┐  ┌─────────┐            │  Card type tiles: 88×80px each
│  │  ✦ 👤   │  │  ✦ ⚡   │            │  bg: #1A1A2E
│  │  PEOPLE │  │  EVENT  │            │  Selected: border 2px #C0392B
│  └─────────┘  └─────────┘            │  Icon: 32px
│  ┌─────────┐  ┌─────────┐            │  Label: 11px bold
│  │  ✦ 🗺   │  │  ✦ ⚔   │            │
│  │  BLOCK  │  │  MOVE   │            │
│  └─────────┘  └─────────┘            │
│  Describe your card                   │  15px bold #F2F2F2
│  ┌─────────────────────────────────┐  │  Textarea: min-h 120px
│  │  A snitch who used to run with  │  │  bg: #1A1A2E
│  │  the Governors but flipped...   │  │  border: 1px #2E2E4A (default)
│  │  |                              │  │  border: 1px #C0392B (focused) + glow
│  └─────────────────────────────────┘  │
│  0 / 280 characters                   │  Char counter: 11px #888888
│  ┌─────────────────────────────────┐  │  Active when: type selected + text > 20
│  │      ✦  GENERATE CARD           │  │  56px h, bg #C0392B
│  └─────────────────────────────────┘  │  disabled: bg #2E2E4A, text #444444
│  💡 More detail = richer hidden stats │  11px #888888
└───────────────────────────────────────┘
```

#### Screen 2 — AI Generation Loading

```
┌───────────────────────────────────────┐
│  [≡]  CARD ENGINE               [?]  │
├───────────────────────────────────────┤
│   [GHOST CARD — SKELETON SHIMMER]     │  Placeholder card: 300×420px centered
│   300 × 420px centered                │  bg: gradient shimmer
│   Shimmer left-to-right, 1.2s loop    │  Shimmer keyframe:
│   Uses faction color as shimmer tint  │    0% → 0.3, 50% → 0.7, 100% → 0.3
│   Assigning hidden motive...          │  17px #888888, centered
│                                       │  Status copy cycles (240ms crossfade):
│                                       │  1. "Reading the block..."
│                                       │  2. "Assigning hidden motive..."
│                                       │  3. "Building consequence chain..."
│                                       │  4. "Generating card art..."
│   ████████████░░░░░░  67%             │  Progress bar: shown only if > 3s
│                                       │  h: 4px, bg #2E2E4A, fill #C0392B
└───────────────────────────────────────┘
```

#### Screen 3 — Card Preview & Edit

```
┌───────────────────────────────────────┐
│  ← Back                  [SAVE CARD] │  Save: 15px bold #D4AC0D
├───────────────────────────────────────┤
│  [FULL CARD RENDER — AS GENERATED]    │  300×420px centered
│  300 × 420px                          │  Tapping card → card zoom modal
│              [↺ Regen Art]            │  32×32px icon, regenerates art only
├───────────────────────────────────────┤
│  VISIBLE STATS               [Edit ✎] │  Section header + edit toggle
│  Name          Darius Webb            │  Field rows: h 48px each
│  Role          Broker            ▾    │  bg: #1A1A2E
│  Loyalty       8 / 10        ─○──    │  border-bottom: 1px #2E2E4A
│  Faction       Governors         ▾   │  ▾ = picker, ─○── = slider
│  Block         Woodlawn          ▾   │
│  Status        Active            ▾   │
├───────────────────────────────────────┤
│  HIDDEN STATS               [Preview] │  Collapsed by default
│  True motive   Survival + grief   ✎  │  Same field row pattern
│  Flip trigger  War near Englewood  ✎  │  Warning banner: "Editing hidden
│  Betrayal thr. 4 / 10             ✎  │  stats changes AI behavior in-game"
├───────────────────────────────────────┤
│  SCENARIO SCRIPTS           [Edit ✎] │
│  Scenario 1  ▸ Alliance offer         │  Collapsed previews: h 48px each
│  Scenario 2  ▸ Information request    │  Tap to expand → full script edit
│  Scenario 3  ▸ War pressure           │
├───────────────────────────────────────┤
│  ┌─────────────────────────────────┐  │
│  │       SAVE TO MY CARDS          │  │  56px, bg #C0392B
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │    ADD TO PACK & PUBLISH        │  │  48px, border 1px #888888
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

#### Screen 4 — Pack Bundling

```
┌───────────────────────────────────────┐
│  ← Back              CREATE PACK      │  24px bold centered
├───────────────────────────────────────┤
│  Pack Name                            │
│  ┌─────────────────────────────────┐  │  h: 48px input
│  │  My Woodlawn Pack               │  │  bg: #1A1A2E
│  └─────────────────────────────────┘  │
│  Description (optional)               │
│  ┌─────────────────────────────────┐  │  h: 80px textarea
│  │  Characters from the Woodlawn   │  │
│  │  power struggle...              │  │
│  └─────────────────────────────────┘  │
│  Include Cards                        │  15px bold
│  ☑  Darius Webb         [People]      │  Row: h 48px
│  ☑  Power Vacuum        [Event]       │  Checkbox: 24×24px, #C0392B
│  ☐  71st Street Raid    [Event]       │  Card type badge: 11px
│  ☑  Woodlawn Hold       [Block]       │
│  4 cards selected · 2 People          │  13px #888888 summary
│  1 Event · 1 Block                    │
│  ┌─────────────────────────────────┐  │
│  │   ✦  PUBLISH TO COMMUNITY       │  │  56px, bg #C0392B
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

#### Screen 5 — Community Submission Confirmation

```
┌───────────────────────────────────────┐
│                                       │  bg: #0D0D0D
│  [ANIMATED PACK CARD]                 │  Blueprint card animation
│  300 × 420px centered                 │  300ms delay → flip reveal (800ms)
│  Pack Submitted ✓                     │  24px bold #27AE60
│  My Woodlawn Pack                     │  17px #888888
│  ─────────────────────────────────── │
│  Share your pack                      │  15px bold
│  ┌────────┐  ┌────────┐  ┌────────┐  │  Share tiles: 80×48px
│  │   𝕏    │  │  TG    │  │  COPY  │  │  bg: #1A1A2E
│  └────────┘  └────────┘  └────────┘  │
│  ┌─────────────────────────────────┐  │
│  │       VIEW IN COMMUNITY         │  │  48px, border 1px #888888
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │         BUILD ANOTHER           │  │  48px, border 1px #888888
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

---

## 13. Build Roadmap

<!-- [ENGINE] — Phase gates are fixed. Timeline estimates are [TEMPLATE].
     MVP FOCUS: Chat-playable game first, then visual UI.
     NFT and DLC systems are POST-MVP. Multiplayer is architecturally planned but deferred. -->

> **MVP Scope — Chat-First:**
> The first playable version of BL0CKS must be **fully playable inside an AI chat interface** — Claude, Gemini, ChatGPT, or any conversational AI. The entire game architecture is Markdown-driven, AI-resolved, and text-native. Territory maps render as text grids. Cards render as formatted message blocks. Decisions are prompted as numbered choices. Consequences are narrated. No visual UI, no mobile app, no frontend framework is required for v1.
>
> This is not a fallback mode — **this is the primary MVP delivery target.** The visual mobile UI (Section 12) is the *second* phase, built on top of a proven chat-playable core. This strategy validates the game loop with zero frontend engineering and ships on day one to anyone with an AI chat window.

### 13.1 Chat-First Architecture — MVP Requirement

<!-- [ENGINE] — This is a non-negotiable MVP constraint. The game MUST work in a plain text chat. -->

The entire game engine runs as a **structured AI conversation**. The Markdown files (levels, cards, characters, prompts) are loaded into the AI's context window. The AI manages game state, resolves hidden stats, and narrates consequences — all within the chat thread.

**What the player sees in chat (example turn):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BL0CKS · Level 5 · Woodlawn Fracture
  🕐 Clock: 8/12 ticks · Act II
  💪 Influence: ●●●○○○ (3/6)
  🔥 Heat: ██████░░░░░░░░░░░░░░ 6/20 [WARM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 TERRITORY
  ● Woodlawn — YOU (Governors) · ⛨ 2 Block Points
  ● Auburn Gresham — YOU (Governors)
  ○ Englewood — RIVAL (Lords)
  ◑ Chatham — CONTESTED
  ◐ Hyde Park — NEUTRAL
  ○ Roseland — RIVAL (Stones)

📻 STREET WHISPER: [INTENT: ASSAULT] "The Lords are
   massing foot soldiers at 79th. Auburn Gresham will
   fall at end of turn if you don't Block or Stack it."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ EVENT: POWER VACUUM
The Governors just lost their top lieutenant.
Nobody knows who gave the order. +1 Heat.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🃏 YOUR HAND:
  1. 👤 Darius Webb — Broker ◆CONNECT · Woodlawn
     Loyalty 8/10 · Cost: ●○○ (1 Inf)
  2. 👤 Marcus Cole — Enforcer ⛨BLOCK · Englewood
     Loyalty 5/10 · Cost: ●●○ (2 Inf)
  3. 👤 Tanya Rivers — Informant 💰HUSTLE · Chatham
     Loyalty 7/10 · Cost: ●○○ (1 Inf)
  4. ⚔️ TAX — Cost: ●○○ (1 Inf) · Collect resources
  5. ⚔️ WAR — Cost: ●●● (3 Inf) · Challenge rival block

🔒 Intel Cards remaining: 2
🏆 Active Assets: 🍽️ Greek Diner · 🔫 Corner Armory

PHASE 5 — ACT. You have 3 Influence. Spend wisely.
What do you play? (1-5, or type INTEL [Name])
(Play multiple cards by chaining: "2, 4" = Marcus + Tax)
```

**What happens after a People Card choice:**

```
> You played: 👤 Darius Webb (◆ CONNECT) — Cost 1 Influence
  Remaining Influence: ●●○○○○ (2/6)

ᐅ CONNECT triggered: Darius reveals that Marcus Cole
  has a hidden allegiance to... [LOCKED — spend Intel
  to see, or take the Gambit]

Darius wants a cut of the Woodlawn block.
Says he's earned it. You decide.

  ← [A] DENY — "He goes cold. Loyalty -2. No Heat."
  → [B] GIVE CUT — "He stacks for you. +1 loyalty.
     Ledger: Darius owes you a debt."
  🎲 [G] GAMBIT: DOUBLE DOWN — "Offer him the WHOLE
     block. If his hidden loyalty is ≥ 6, he swears a
     blood oath (+4 loyalty, gains ⛨ BLOCK keyword).
     If < 6... he takes it and flips. Woodlawn is gone."

Your call? (A, B, or G) — then continue playing cards
```

**What happens at end of turn (Phase 8-10 resolution):**

```
━━━━━ TURN RESOLUTION ━━━━━
ᐅ COMBO CHECK: ◆ CONNECT resolved (Darius intel).
ᐅ INTENT RESOLVES: Auburn Gresham — BLOCKED by Marcus.
  ⛨ 3 Block Points absorbed the Lords' assault.
  Auburn Gresham holds. Lords retreat.
ᐅ HEAT CHECK: 🔥 6 → 7 (+1 auto). Still [WARM].
  Modifier: People Cards cost +1 Influence at WARM.
ᐅ CLOCK: 8/12 → 6/12 (2 ticks consumed this turn).
ᐅ LEDGER UPDATED: Darius — debt recorded.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         → Next turn begins...
```

**What happens after level complete (The Stash):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✦ LEVEL 5 COMPLETE — WOODLAWN FRACTURE
  "You read the room before the room read you."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 LEVEL STATS:
  Turns taken: 8 · Heat generated: 4
  Territory: 3 held, 1 lost, 2 rival
  Gambits taken: 1 (WON) · Cards exhausted: 2

━━━ THE STASH ━━━
Choose 1 Asset. This is permanent for your run.

  [A] 📱 BURNER NETWORK — Hand size +1 (draw 6).
      Must Exhaust 1 card at start of each level.
  [B] 💸 THE PLUG — Tax generates double from first block.
  [C] 🏠 SAFE HOUSE — Lose a territory? 1 crew escapes.

Your pick? (A, B, or C)
```

**How this maps to the visual UI later:**

| Chat Element | Visual UI Equivalent |
|---|---|
| Text territory grid | SVG territory map (Zone 4) |
| Numbered card list with cost pips | Hand Tray (Zone 5) with Influence cost badges |
| A/B/G choice prompt | Reigns-style swipe overlay + Gambit button |
| Narrated consequences | Consequence cascade animation |
| `[HIDDEN] ???` text | Locked hidden stats panel |
| `INTEL` command | Intel Card reveal button |
| Street Whisper intent line | Event Ticker (Zone 2) with intent badge |
| Clock tick counter | Clock Bar (Zone 3) |
| Influence pip display | Influence meter in nav bar |
| Heat meter progress bar | Heat gauge (new Zone 3b) |
| Keyword badges on cards | Icon badges on card face |
| The Stash reward screen | Full-screen modal with card-flip reveal |
| Asset list display | Asset tray in side drawer |
| Ledger updates | Persistent notification toasts |

**Chat-first design constraints:**
- All game state must be expressible as plain text — no binary state
- All player inputs must be simple text commands or numbered choices
- The AI must maintain session state within the conversation context
- Level files, card templates, and prompt files serve as the AI's "game ROM"
- A single system prompt + level file + Ledger state must be sufficient to start a session
- Influence, Heat, and Ledger values must be displayed every turn — never hidden from player

### 13.2 Build Roadmap

| Phase | Milestone | Key Deliverables | Est. Duration | MVP? |
|---|---|---|---|---|
| **Phase 0** | Concept + Architecture | GDD v3.0 complete (mechanics-integrated), card schema, world bible, JWT spec | Complete | ✅ |
| **Phase 1** | Chat-Playable Engine | System prompts, level files, card templates, character files — full Act I playable in any AI chat | 4–6 weeks | ✅ |
| **Phase 2** | Full Chat Campaign | All 12 levels playable in chat, Card Creation via chat prompts, 60-card base set | 6–8 weeks | ✅ |
| **Phase 3** | Visual UI — Mobile App | Mobile card renderer, swipe mechanics, territory map, onboarding flow (Section 12) | 8–10 weeks | ✅ |
| **Phase 4** | Multi-Model Routing + Auth | SSO + API key auth, model router, edition detection, JWT cloud endpoint | 6–8 weeks | ✅ |
| **Phase 5** | Card Creation Engine UI | Visual card builder, pack bundling, community registry v1 | 6–8 weeks | ✅ |
| **Phase 6** | NFT Achievement System | Base chain contract, achievement minting, Pack Origin NFT, wallet connection | 6–8 weeks | Post-MVP |
| **Phase 7** | DLC + Community Layer | Upvote system, AI moderation, DLC delivery pipeline, revenue share | 4–6 weeks | Post-MVP |
| **Phase 8** | Provider Partnerships | Pitch Anthropic/Google/OpenAI on edition licensing, Season 1 DLC production | 6–8 weeks | Post-MVP |
| **Phase 9** | Multiplayer Foundation | PvP hidden-loyalty mode, real-time session sync, matchmaking, spectator mode | 8–12 weeks | Post-MVP |
| **Phase 10** | Full Launch | OSS engine release, hosted game live, creator marketplace, Season 1 drop | 4 weeks | Post-MVP |

### 13.3 Multiplayer Architecture — Design Scaffold

<!-- [ENGINE] — Multiplayer is NOT in MVP scope but the architecture must account for it from Phase 1.
     These constraints ensure the core engine doesn't need rewriting when PvP ships. -->

> **Design Constraint:** All MVP systems must be built **multiplayer-aware** even though multiplayer ships post-MVP. This means:

| System | Single-Player (MVP) | Multiplayer-Ready Requirement |
|---|---|---|
| Game state | Local session state object | Must be serializable to JSON — no DOM-coupled state |
| Turn resolution | AI resolves immediately | Must support async resolution (player B has not acted yet) |
| Hidden stats | AI knows all, player sees partial | Each player's view must be independently computed |
| Clock system | Local timer | Must support server-authoritative tick sync |
| Card plays | Immediate effect | Must support queued actions with server confirmation |
| Session identity | JWT with single player_id | JWT must support `opponent_id` field (nullable for solo) |
| Event cards | System-drawn per turn | Must support "shared events" visible to both players |

**PvP Mode Concept (Phase 8):**
- Two players each manage hidden loyalty on the same territory board
- Each player sees their own People Cards' visible stats — but the opponent's People Cards are fully hidden
- Intel Cards can be spent to reveal opponent's character stats (not just hidden AI stats)
- The AI acts as **neutral referee** — resolving contested blocks, triggering shared events
- Session length remains 20–25 minutes — same design constraint as single-player
- Matchmaking by edition tier: Platinum vs Platinum, Gold vs Gold, etc.

---

## 14. Markdown File Architecture

<!-- [ENGINE] — Directory structure is fixed. File contents are [TEMPLATE]. -->

```
/blocks
├── /engine
│   ├── model_router.js           ← Detects API key type → routes to adapter
│   ├── jwt_validator.js          ← Validates session JWT from cloud
│   ├── card_renderer.js          ← Renders MD card files to game objects
│   ├── difficulty_resolver.js    ← Reads JWT difficulty_gate — not local files
│   ├── session_state.js          ← Serializable game state (multiplayer-ready)
│   ├── auth_manager.js           ← SSO + manual key entry, provider detection
│   └── /adapters
│       ├── claude.md             ← Prompt format, token limits, capability flags
│       ├── gemini.md
│       ├── gpt4o.md
│       ├── mistral.md
│       ├── llama3.md
│       └── ollama.md
│
├── /world
│   ├── territories.md            ← Block definitions, cross streets, flavor
│   ├── factions.md               ← Faction rules, rivalry maps, board colors
│   ├── lore.md                   ← World history, event timeline
│   └── aesthetic.md              ← Art direction, music style, palette
│
├── /characters
│   ├── [character_id].md         ← One file per NPC
│   └── /templates
│       └── character_base.md     ← Base template for AI generation
│
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
│   ├── level_12_endgame.md
│   └── level_XX_secret_arc.md    ← Unlocks OG achievement
│
├── /cards
│   ├── /base
│   │   ├── people/               ← [id].md per card
│   │   ├── events/
│   │   ├── blocks/
│   │   └── moves/
│   ├── /custom                   ← Player-created cards (local)
│   └── /templates
│       ├── people_card.md
│       ├── event_card.md
│       ├── block_card.md
│       └── move_card.md
│
├── /dlc                          ← Post-MVP: DLC delivery
│   ├── /installed
│   └── /registry
│       └── community_registry.json
│
├── /prompts
│   ├── story_generator.md        ← Master session narrative prompt
│   ├── puzzle_logic.md           ← AI win condition generation rules
│   ├── card_autofill.md          ← Card Creation Engine base prompt
│   └── npc_dialogue.md           ← Real-time NPC response prompt
│
└── /config
    ├── game.json                 ← Version, season, base config
    ├── theme.json                ← Visual tokens — flavor only, not logic
    └── auth_providers.json       ← SSO endpoints + key prefix patterns
```

### What Lives in Markdown vs. Cloud

| Layer | Stored In | Modifiable By Player |
|---|---|---|
| Narrative flavor | Markdown (local) | Yes |
| Card flavor text | Markdown (local) | Yes |
| NPC names + dialogue | Markdown (local) | Yes |
| Art style direction | Markdown (local) | Yes |
| Hidden stat generation | Prompt files (local) + AI (cloud) | Prompt only |
| Auth / SSO tokens | Cloud (JWT, never stored locally) | No |
| Difficulty gate values | JWT (cloud, signed) | No |
| Edition assignment | JWT (cloud, signed) | No |
| DLC content | CDN (cloud) — post-MVP | No |
| NFT minting | Smart contract (cloud wallet) — post-MVP | No |
| Win/loss condition logic | JWT + cloud game engine | No |
| Multiplayer state | WebSocket server — post-MVP | No |

---

## 15. Open Design Questions

The following require resolution before Phase 2 development gates open:

### MVP-Critical (Resolve Before Phase 2)

1. **Influence Balance Testing** — Is base Influence of 3 the right number? Too low = player feels helpless. Too high = no tension. Requires extensive playtesting across all 12 levels. Test with 2, 3, and 4 as base values. **This is the single most important tuning variable in the game.**

2. **Heat Curve Per Act** — Does Heat carrying across levels within an Act create the right pressure? If Heat is too punishing, players feel unfairly punished for playing aggressively. If too lenient, the Federal Indictment threshold never matters. Playtest with Heat reset at every level vs. carry-forward.

3. **Gambit Probability Tuning** — 40% Gambit appearance rate is a starting hypothesis. Too high = dilutes impact. Too low = players forget the mechanic exists. Also: should Gambit outcome be purely hidden-stat-gated, or should there be a random component?

4. **Keyword Distribution Across Base Deck** — How many People Cards carry each keyword? If Block is too common, defensive play is always optimal. If Hustle is too rare, economy combos never appear. Define keyword distribution curve for the 60-card base set.

5. **SSO Provider Integration Scope** — Which providers offer OAuth/SSO for API access at launch? Define which SSO integrations ship in MVP vs. manual key entry fallback.

6. **Session State Serialization Format** — Game state (including Ledger, Heat, Assets, Influence modifiers) must be JSON-serializable from Day 1. Define the canonical state schema before Phase 1 engine work begins.

7. **Model Fallback Chain** — When a player's primary model is rate-limited or down, define the fallback routing order.

### Post-MVP (Resolve Before Relevant Phase)

8. **Asset Pool Expansion** — 12 Assets is the launch set. Plan for 24+ by Season 2. Define the Asset submission pipeline for community-created Assets.

9. **Multiplayer Influence Economy** — In PvP, do both players share a Heat Meter? Do they have separate Influence pools? The Ledger tracks both players' actions — does one player's Grudge affect the other?

10. **The Stash UI vs. Chat** — In chat mode, The Stash is a text menu. In visual UI mode, it should feel like opening a loot crate or treasure chest. Define the animation spec and whether Assets have rarity tiers (common/rare/legendary).

11. **Wallet Onboarding UX** — How do non-crypto players receive their first wallet without friction? Coinbase Smart Wallet is the leading candidate.

12. **Pack IP Ownership** — When a community creator forks the base world and publishes a pack, who owns the IP of derivative cards?

13. **Provider Exclusivity Window Duration** — How long is a Season? Recommend 90-day windows with 30-day advance notice.

14. **Age Verification** — M-rated content + NFT financial mechanics creates a regulatory surface.

---

*End of Document — BL0CKS GDD v3.0*
*Ernesto "Beats" Rodriguez · March 2026 · Confidential*

---

> **Repository note:** This GDD is the source of truth for all design decisions. All implementation specs, API contracts, and design files must reference this document by version number. Breaking changes to game mechanics or monetization structure require a GDD version bump and full team review before implementation proceeds.
>
> **Template note:** Sections marked `[TEMPLATE]` are world-layer swappable — fork creators should replace these for their variant. Sections marked `[ENGINE]` are core mechanics — modify with caution. Sections marked `[CLOUD]` require server-side infrastructure. See Section 7.4 for the full forkability guide.
>
> **v3.0 note:** This revision adds 5 new mechanical systems (Influence, Keywords, Gambit, Heat, Ledger), expands Assets into The Stash, formalizes Boss Encounters, and updates all player-facing displays. The STS_MECHANICS_INTEGRATION.md document has been absorbed into this GDD. All new systems are annotated `[ENGINE]` and are core to the game's fun factor.
