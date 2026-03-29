# {{ROM_NAME}} — Factions

**Instructions for Game Engine:** This file defines the power structures in the world. Each faction has a unique mechanical identity that affects gameplay.

---

## 1. {{FACTION_1}} — Player Faction

**Role:** The player's starting organization.

**Identity:**
- Vibe: <!-- Describe their personality, culture, visual aesthetic -->
- Strength: <!-- What are they good at? Territory control? Information? Economy? -->
- Internal Weakness: <!-- What makes them vulnerable FROM WITHIN? This drives betrayal -->

**Mechanical Rules:**
- People Cards from {{FACTION_1}} start with +1 visible loyalty
- Broker-role characters cost 1 less Influence to play
- TAX generates bonus resources when used in {{FACTION_1}}-controlled territory

**Key Characters:**
- <!-- Name a 2-3 important NPCs that the engine should generate -->

---

## 2. {{FACTION_2}} — Primary Rival

**Role:** The main antagonist. They want what the player has.

**Identity:**
- Vibe: <!-- How do they operate? Violence? Politics? Economics? -->
- Threat Level: <!-- Are they an immediate danger or a slow burn? -->
- Signature Move: <!-- What's their go-to tactic? -->

**Mechanical Rules:**
- {{FACTION_2}} characters have +2 to Block Points when defending their territory
- WAR against {{FACTION_2}} generates +1 Heat (they're connected)
- Their People Cards tend to have high hidden loyalty (they're committed)

**AI Behavior:**
- {{FACTION_2}} expands aggressively — they declare WAR every 3-4 turns
- They prioritize contested territories over neutral ones
- They recruit from neutral territories using Brokers

---

## 3. {{FACTION_3}} — Secondary Rival

**Role:** The wildcard. Different from {{FACTION_2}} in approach and style.

**Identity:**
- Vibe: <!-- What makes them different from Faction 2? -->
- Strategy: <!-- Bribery? Infiltration? Raw force? Political maneuvering? -->
- Unpredictability: <!-- How do they keep the player guessing? -->

**Mechanical Rules:**
- {{FACTION_3}} characters have wider hidden loyalty gaps (less predictable)
- PEACE with {{FACTION_3}} is unreliable — 30% chance of breaking early
- Their People Cards often have the Shadow 👻 keyword

**AI Behavior:**
- {{FACTION_3}} prefers indirect action — SNITCH, alliances, and economic pressure
- They rarely declare WAR directly but will opportunistically attack weakened targets
- They plant double agents (high visible loyalty, low hidden loyalty)

---

## 4. {{NEUTRAL_FORCE}} — Environmental Antagonist

**Role:** A force that neither side controls. Cannot be defeated — only avoided, redirected, or delayed.

**Identity:**
- What are they? <!-- Police? Military? Nature? Corporation? AI surveillance? Criminal tribunal? -->
- Why are they dangerous? <!-- They enforce rules that make everyone's life harder -->

**Mechanical Rules:**
- {{NEUTRAL_FORCE}} cannot be targeted by WAR
- {{NEUTRAL_FORCE}} presence in a territory increases Heat by +1 per turn
- When Heat reaches "Hot" threshold (10+), {{NEUTRAL_FORCE}} begins patrolling contested territories
- When Heat reaches "Federal" threshold (18+), {{NEUTRAL_FORCE}} triggers a raid — all contested territories become neutral

**AI Behavior:**
- {{NEUTRAL_FORCE}} is impartial — they target whoever has the most Heat
- Their INTENT broadcasts should feel menacing but procedural (not personal)
- They never negotiate through PEACE — only withdrawal (GHOST) works

---

## Faction Relationship Matrix

| | {{FACTION_1}} | {{FACTION_2}} | {{FACTION_3}} | {{NEUTRAL_FORCE}} |
|---|---|---|---|---|
| **{{FACTION_1}}** | — | Hostile | Uneasy | Targeted |
| **{{FACTION_2}}** | Hostile | — | Competitive | Ignored |
| **{{FACTION_3}}** | Uneasy | Competitive | — | Feared |
| **{{NEUTRAL_FORCE}}** | Targeted | Ignored | Feared | — |
