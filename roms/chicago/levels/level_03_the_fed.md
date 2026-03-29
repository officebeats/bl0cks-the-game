# BL0CKS Level File: 3 - The Fed (The Raid)

**Instructions for Game Engine:** This level shifts from local CPD pressure to high-stakes Federal investigation. Implement "Resource Drain" mechanics as defined in your system prompt. Every turn with high [HEAT] must now result in a monetary or card loss.

## 1. Level Parameters
- **Act:** II (The Escalation)
- **Level ID:** 03
- **Level Name:** The Fed (The Raid)
- **Clock:** 10 Ticks
- **Starting Intel tokens:** 3

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors)
- **Englewood:** CONTESTED (Stones/governors)
- **Auburn Gresham:** YOU (Governors)
- **Chatham:** RIVAL (Commission - Federal CI presence)
- **Hyde Park:** RIVAL (FBI Command Post)
- **Roseland:** NEUTRAL

## 3. Win / Loss Conditions
- **Win Condition:** Secure active control of Englewood and neutralize the Federal CI in Chatham.
- **Loss Condition 1:** Any 'YOU' controlled territory is successfully Raided by the FBI.
- **Loss Condition 2:** Your [HEAT] threshold exceeds 18 (Federal Indictment).

## 4. Starting Hand (Hardcoded Characters)
*Engine Directive: Inject these exactly as written. The player's crew is beginning to crack under the pressure.*

1. **Agent Miller**
   - **Role:** Undercover (Fed)
   - **Visible Loyalty:** 4/10
   - **Hidden Loyalty:** 1/10 (Always Betrays)
   - **True Motive:** "Searching for a specific ledger item to complete the RICO case. If you play 'INTEL' cards, he gains +1 Hidden Heat against you."
   - **Betrayal Threshold:** 1

2. **The Fixer (Sully)**
   - **Role:** Legal / Clean-up
   - **Visible Loyalty:** 7/10
   - **Hidden Loyalty:** 5/10
   - **True Motive:** "Expensive but effective. Can 'WASH' heat or cards, but demands 2000 SCORE points (Wealth) per use."
   - **Betrayal Threshold:** 3

3. **Marcus Cole**
   - **Role:** Enforcer
   - **Visible Loyalty:** 8/10
   - **Hidden Loyalty:** 8/10
   - **True Motive:** "Solid, but old school. He doesn't trust Sully or the new tech."
   - **Betrayal Threshold:** 6

4. **Move Cards:** `TAX`, `WAR`, `WASH`.

## 5. Opening Turn Narration
**Use this exactly as the first Event block when you boot up the level:**

**⚡ EVENT: THE FEDS HAVE ARRIVED**
"The local CPD was just the warm-up. The DOJ has opened a case on your operation and the streets are suddenly quiet. Too quiet. 

Your crew is fractured. You've brought in Sully to fix the books, but someone in your inner circle is wearing a wire for the Feds. To survive, you need the Englewood territory as a fallback point, and you need to identify the CI in Chatham before they flip."

***STREET WHISPER TO BROADCAST ON TURN 1:*** "[INTENT: INVESTIGATE] The Feds are scanning your ledger for inconsistencies. Your [HEAT] is your most dangerous asset right now. WASH your footprint or prepare for the raid."
