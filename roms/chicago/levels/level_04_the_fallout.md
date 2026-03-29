# BL0CKS Level File: 4 - The Bridge (The Fallout)

**Instructions for Game Engine:** This is the penultimate narrative level. It must trigger "Betrayal" events for any card with a [HIDDEN LOYALTY] less than 4. The player's decisions in Act I/II (stored in your Ledger memory) must be referenced as the reason why the world is falling apart.

## 1. Level Parameters
- **Act:** II (The Fallout)
- **Level ID:** 04
- **Level Name:** The Bridge (The Fallout)
- **Clock:** 8 Ticks (Extremely short)
- **Starting Intel tokens:** 0

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors - Final Holdout)
- **Englewood:** RIVAL (Stones)
- **Auburn Gresham:** CONTESTED (Stones/Feds)
- **Chatham:** CONTESTED (Police/Commission)
- **Hyde Park:** RIVAL (Federal HQ)
- **Roseland:** RIVAL (Stones)

## 3. Win / Loss Conditions
- **Win Condition:** Hold Woodlawn and successfully 'BURN' one internal traitor before the clock runs out (Survival).
- **Loss Condition 1:** Any 'YOU' controlled territory is lost to any rival faction.
- **Loss Condition 2:** Your inner circle is wiped out by internal betrayal.

## 4. Starting Hand (Hardcoded Characters)
*Engine Directive: Inject these exactly as written. The fallout has happened. Trust is gone.*

1. **⚠️ CRITICAL CHOICE [INTERNAL BETRAYAL]**
   - **Role:** Status Event (Triggers on Turn 1)
   - **Description:** "You are at a literal bridge. Woodlawn is the last stand. Someone in your hand is currently feeding your location to the other factions. You have the choice: Burn them now, or wait to see if they save you."

2. **Darius Webb**
   - **Role:** Broker
   - **Visible Loyalty:** 3/10 (PLUMMETED)
   - **Hidden Loyalty:** 2/10
   - **True Motive:** "A strategist whose loyalty is purely transactional. With the Feds closing in, he's looking for an out. If you don't 'BURN' him now, he might Flip your final territory."
   - **Betrayal Threshold:** 1

3. **Marcus Cole**
   - **Role:** Enforcer
   - **Visible Loyalty:** 10/10 (TRUE LOYALTY)
   - **Hidden Loyalty:** 10/10
   - **True Motive:** "He's with you to the end. But he's one man. He will hold Woodlawn solo for 2 ticks even if others betray you."
   - **Betrayal Threshold:** 9

4. **Move Cards:** `GHOST`, `WAR`, `BURN`.

## 5. Opening Turn Narration
**Use this exactly as the first Event block when you boot up the level:**

**⚡ EVENT: THE FINAL FALLOUT**
"The Chicago South Side has essentially gone dark. The Feds are sweeping every corner, and the Commission has turned their backs on the Governors. 

You're at the bridge between Woodlawn and the north. Your final holdout is under siege. You have exactly 8 ticks to decide how to end this. You've brought your closest circle together—but the air is thick with the knowledge that someone here has already signed your indictment. Who survives?"

***STREET WHISPER TO BROADCAST ON TURN 1:*** "[INTENT: BETRAYAL] One of your cards is currently a Federal Asset. Identify and BURN them before they trigger a raid on Woodlawn."
