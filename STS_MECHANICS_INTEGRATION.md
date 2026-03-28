# Slay the Spire Mechanics Integration for BL0CKS

*Slay the Spire (1 & 2)* is widely considered the gold standard for roguelike deckbuilders. Its popularity comes from a feeling of "controlled chaos"—RNG exists, but the player has exactly enough information and agency to solve the puzzle of each turn. 

Here is how we can translate StS’s most compelling mechanics directly into the existing architecture of **BL0CKS**.

---

## 1. The "Intent" System (Predictive Open Information)
**Slay the Spire:** Enemies display their exact intent above their head (e.g., "Will attack for 12," or "Will add a curse to your deck"). This changes gameplay from reacting to *past* moves to preemptively solving *future* threats.

**BL0CKS Translation: The "Street Whisper" Mechanic**
Instead of the AI just declaring what happened, the `scanner` or `event` section should clearly broadcast the **Rival's Intent** for the *next* turn.

*   **Current State:** 📻 *"Lords are pushing east."* (Vague narrative).
*   **StS Style State:** 📻 *STREET WHISPER: [INTENT: ASSAULT] The Lords are massing to take Auburn Gresham. If undefended, you will lose the territory at the end of this turn.*
*   **Why it works:** The player isn't guessing. If the player plays an Enforcer in Auburn Gresham, they know they are explicitly blocking 1 "Assault" action. If they ignore it to play a TAX card elsewhere, they are making a conscious, tactical trade-off.

## 2. Block vs. Health (Temporary Mitigation vs. Permanent Loss)
**Slay the Spire:** "Block" (shields) clears at the end of every turn. "Health" damage is permanent for the rest of the Act. You must balance temporary survival with long-term scaling.

**BL0CKS Translation: "Heat" vs. "Loyalty/Territory"**
*   **Heat (Temporary):** When rival factions or police push, they generate "Heat" in a territory. Playing an Enforcer or Fixer card *mitigates* that Heat for the current turn.
*   **Loyalty/Control (Permanent):** If Heat exceeds your defense in a territory at the end of a turn, you take permanent damage—a Crew member loses Loyalty (permanently), or the Territory downgrades from `● YOU` to `◐ CONTESTED`. 
*   **The Gameplay Loop:** Does the player spend their turn mitigating Heat (playing Defense) or taking permanent territory (playing Attack), knowing they will suffer a permanent loyalty loss if they ignore the Heat?

## 3. Deck Thinning and Deck Bloat
**Slay the Spire:** You start with basic "Strikes" and "Defends". A primary strategy is removing these weak cards so you draw your powerful, synergistic cards more often. Conversely, enemies add "Curses" or "Status Effects" to bloat your deck.

**BL0CKS Translation: "Dead Weight" and "Burner Phones"**
*   **Deck Thinning:** The player should have the ability to "Cut Ties" (Exhaust) with low-loyalty or low-impact crew members to ensure they draw their heavy hitters (like Darius Webb or Marcus Cole) more consistently. 
*   **Enemy Bloat (Curses):** Rivals or Police can shuffle "Informants," "Paranoia," or "Heat" cards into your deck. These are dead draws. 
    *   *Example:* Police raid a stash house. The AI shuffles two `PARANOIA` cards into your deck. When drawn, they can't be played and take up hand space, representing the crew being too scared to act.

## 4. Relics (Persistent Passive Buffs)
**Slay the Spire:** You defeat Elite enemies to gain Relics, which provide permanent rule-breaking buffs (e.g., "Start every combat with 1 extra energy" or "Every 3rd attack deals double damage").

**BL0CKS Translation: "Assets & Infrastructure"**
Instead of just fighting for territory, specific territories (or specific narrative choices) should grant permanent Assets.
*   **Example Assets:**
    *   *The Greek Diner:* (Relic) The first Intel card you play in a level is free.
    *   *Crooked Alderman:* (Relic) Once per level, you can ignore a Police Raid event.
    *   *Burner Network:* (Relic) You draw 6 cards per turn instead of 5, but you must discard 1 at the start of your turn.

## 5. Scaling Escalation (The "Ascension" System)
**Slay the Spire:** As you beat the game, you unlock Ascensions (1 through 20), each adding a permanent negative modifier (Enemies have more health, you find less gold, etc.).

**BL0CKS Translation: "The Heat Level"**
As the player progresses toward Act 3 (The Feds), the overall "City Heat" rises, adding global modifiers to the AI prompt:
*   *Heat Level 1:* Normal play.
*   *Heat Level 2:* Informants (Cards) start with -1 maximum Loyalty.
*   *Heat Level 3:* Rival factions coordinate attacks on the same turn.

## Summary: Steps to Implement in the AI Engine

To bring BL0CKS closer to StS, we need to update the `SYSTEM_PROMPT.md` with these specific instructions for the LLM:

1.  **Mandate Clear Intents:** The AI must explicitly state what the enemy will do *next turn* if not blocked.
2.  **Card 'Exhaustion':** Allow players to intentionally burn cards from their deck permanently to thin their roster.
3.  **Introduce Status Cards:** Allow the AI to inject "Heat" or "Paranoia" cards into the player's deck, polluting their draw pool.
4.  **Keyword Mechanics:** Standardize effects. E.g., `Enforcer` = Block. `Tax` = Energy/Resource generation. `War` = Damage.
