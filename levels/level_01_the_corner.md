# BL0CKS Level File: 1 - The Corner

**Instructions for Game Engine:** This file is the starting ROM for the game. Load these rules immediately. The opening Event must be the "POWER VACUUM" narrative block provided below. 

## 1. Level Parameters
- **Act:** I
- **Level ID:** 01
- **Level Name:** The Corner
- **Clock:** 12 Ticks
- **Starting Intel tokens:** 2

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors)
- **Englewood:** RIVAL (Lords)
- **Auburn Gresham:** CONTESTED
- **Chatham:** CONTESTED
- **Hyde Park:** NEUTRAL
- **Roseland:** RIVAL (Stones)

## 3. Win / Loss Conditions
- **Win Condition 1 (Aggressive):** You take control of Auburn Gresham before the Clock reaches 12.
- **Win Condition 2 (Defensive):** You survive all 12 Clock ticks while maintaining control of Woodlawn.
- **Loss Condition:** You lose Woodlawn to a Rival or a CPD lockdown.

## 4. Starting Hand (Hardcoded Characters)
*Engine Directive: Inject these exactly as written for the player's starting hand. Note their true motives and track their hidden loyalties silently based on the player's choices.*

1. **Darius Webb**
   - **Role:** Broker
   - **Visible Loyalty:** 8/10
   - **Hidden Loyalty:** 5/10
   - **True Motive:** "Survival. He is terrified of the Lords and will secretly sell you out if they attack Woodlawn."
   - **Betrayal Threshold:** 3

2. **Marcus "Cole" Coleman**
   - **Role:** Enforcer
   - **Visible Loyalty:** 5/10
   - **Hidden Loyalty:** 8/10
   - **True Motive:** "Genuine, unshakeable loyalty to you. But he is deeply, violently paranoid that Darius is a rat."
   - **Betrayal Threshold:** 2

3. **Tanya Rivers**
   - **Role:** Informant
   - **Visible Loyalty:** 7/10
   - **Hidden Loyalty:** 6/10
   - **True Motive:** "Skimming your tax collections to buy her little brother's way out of the city before it's too late."
   - **Betrayal Threshold:** 4

4. **Move Cards:** Always stock the player hand with `TAX` and `WAR`.

## 5. Opening Turn Narration
**Use this exactly as the first Event block when you boot up the level:**

**⚡ EVENT: POWER VACUUM**
"The Governors just lost their top lieutenant on 63rd & King. Nobody knows who gave the order, but the Lords over in Englewood are moving fast to claim the power vacuum in Auburn Gresham. 

The brass just handed you this corner. Hold Woodlawn. Take Auburn Gresham if you can. Trust no one."
