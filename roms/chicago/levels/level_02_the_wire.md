# BL0CKS Level File: 2 - The Wire

**Instructions for Game Engine:** Load these rules immediately. This level heavily tests the "Heat/Paranoia" status card mechanic and predictive [INTENT: ASSAULT/RAID] mechanics defined in your system prompt. Make the police presence suffocating.

## 1. Level Parameters
- **Act:** I
- **Level ID:** 02
- **Level Name:** The Wire
- **Clock:** 15 Ticks
- **Starting Intel tokens:** 1

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors)
- **Englewood:** NEUTRAL
- **Auburn Gresham:** YOU (Governors)
- **Chatham:** RIVAL (Commission)
- **Hyde Park:** RIVAL (CPD - Police Control)
- **Roseland:** RIVAL (Stones)

## 3. Win / Loss Conditions
- **Win Condition:** Survive 15 Clock ticks without losing any territory to the CPD (Police).
- **Loss Condition 1:** The CPD takes control of Woodlawn or Auburn Gresham.
- **Loss Condition 2:** You are forced to 'BURN' two of your starting crew due to Paranoia bloat.

## 4. Starting Hand (Hardcoded Characters)
*Engine Directive: Inject these exactly as written. The player starts with 1 Paranoia card already clogging their hand.*

1. **Detective Vance**
   - **Role:** Corrupt Cop (Informant)
   - **Visible Loyalty:** 6/10
   - **Hidden Loyalty:** 4/10
   - **True Motive:** "Selling you scraps of info to build a RICO case. If you spend too much time pushing him or failing to pay his TAX, he accelerates the raids."
   - **Betrayal Threshold:** 2

2. **Little Kev**
   - **Role:** Runner
   - **Visible Loyalty:** 9/10
   - **Hidden Loyalty:** 9/10
   - **True Motive:** "Fiercely loyal, but reckless. If he takes too much heat, he might do something stupid that triggers an immediate Police Raid event."
   - **Betrayal Threshold:** 5

3. **⚠️ PARANOIA**
   - **Role:** Status Card (Unplayable)
   - **Description:** "Heat is building. The block is watching. Clogs your hand."

4. **Move Cards:** `TAX`, `GHOST`. (Player does not start with WAR in this defensive scenario).

## 5. Opening Turn Narration
**Use this exactly as the first Event block when you boot up the level:**

**⚡ EVENT: THE CLAMP DOWN**
"You took Auburn Gresham, but you made too much noise doing it. The CPD set up a mobile command unit in Hyde Park and they are listening to the wire. 

Your crew is spooked and carrying Paranoia. You can't fight the cops in a straight War, you can only survive the clock."

***STREET WHISPER TO BROADCAST ON TURN 1:*** "[INTENT: RAID] The CPD is preparing to sweep through Auburn Gresham. Block it by playing an Enforcer/Defensive action, or GHOST the block."
