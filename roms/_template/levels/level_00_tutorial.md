# {{ROM_NAME}} — Level 00: Tutorial

**Instructions for Game Engine:** This is the tutorial level. Guide the player through the basics step by step. Use a friendly, instructive tone. This is NOT a real game — it's training.

## Parameters
- Clock: 6
- StartingInfluence: 5
- StartingHeat: 0
- Territory: {{TERRITORY_1}}, {{TERRITORY_3}}
- Factions: {{FACTION_1}}, {{FACTION_2}}
- Difficulty: Tutorial

## Narrative Hook
Welcome to {{ROM_NAME}}. This is a safe run — a training exercise before the real thing.

You've got one block, one rival, and three things to learn:
1. **Intel** — How to read your people (visible vs. hidden loyalty)
2. **Moves** — How to play cards (TAX, WAR)
3. **Choices** — How to make decisions when your People Cards trigger events

Let's go.

## Starting Hand
- People: {{CHARACTER_1}} (Broker, Loyalty 7, Hidden: 5)
- Move: TAX
- Move: WAR

## Tutorial Sequence

### Step 1: Intel
> First: know who you're working with.
> {{CHARACTER_1}} looks loyal. But everyone has a hidden side.
> Type `INTEL {{CHARACTER_1}}` to inspect them.

**Expected input:** `INTEL {{CHARACTER_1}}`

**AI reveals:**
> {{CHARACTER_1}} — Visible Loyalty: 7. Hidden Loyalty: 5.
> True Motive: "{{HIDDEN_MOTIVE}}"
> The gap is 2. Small — but worth knowing.

### Step 2: TAX
> Good. Now let's make some moves.
> Play the TAX card to collect resources from {{TERRITORY_1}}.

**Expected input:** `1` (play card #1 = TAX) or `play TAX`

**AI responds:**
> TAX collected from {{TERRITORY_1}}. Your operation is funded. +1 Influence.

### Step 3: WAR
> Time to expand. {{TERRITORY_3}} is contested.
> Play WAR to take it.

**Expected input:** `2` or `play WAR` targeting {{TERRITORY_3}}

**AI responds:**
> WAR declared on {{TERRITORY_3}}. {{FACTION_2}} defends with [NPC name].
> Your crew: {{CHARACTER_1}} (Loyalty 7). Their crew: [NPC] (Loyalty 5).
> Victory. {{TERRITORY_3}} is yours.

### Step 4: Tutorial Complete
> That's the basics. In the real game:
> - People Cards have secrets. Intel reveals them.
> - Move Cards cost Influence. Spend wisely.
> - Heat rises every turn. Stay cool or the {{NEUTRAL_FORCE}} shows up.
> - The Ledger remembers everything.
>
> Ready for Level 1? Press Enter.

## Win Conditions
- Complete all tutorial steps

## Loss Conditions
- (Tutorial cannot be lost)
