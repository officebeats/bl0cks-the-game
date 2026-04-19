# BL0CKS Level ROM: 01 - The Corner

**⚡ ENGINE DIRECTIVE:** This is the entry-point ROM. Load logic immediately. Opening narration must trigger `EVENT: POWER_VACUUM_63RD` on first tick.

---

## 1. Parameters
- **Act:** I (The Corner)
- **ID:** 01
- **Clock:** 12 Ticks
- **Intel:** 2 Tokens
- **Ambient Tone:** Rainfall, distant sirens, low-pass filter on lo-fi tracks.

## 2. Global State
- **Woodlawn**: YOU (Governors — Legacy Hold)
- **Englewood**: RIVAL (Lords — Fortified)
- **Auburn Gresham**: CONTESTED (The Prize)
- **Chatham**: CONTESTED (High Paranoia)
- **Roseland**: RIVAL (Stones — Silk Hand)

## 3. Victory Conditions
| Condition | Trigger | Reward |
|-----------|---------|--------|
| **Dominance** | Control Auburn Gresham before Tick 12 | Unlock: *Corner Armory* Asset |
| **Survival** | Maintain Woodlawn for 12 Ticks | Proceed to Level 02 |
| **LOSS** | Lose Woodlawn or Heat hits 20 | Run Terminated |

## 4. Starting Hand
1. **Darius Webb** (Broker)
   - *Visible:* Loyalty 8/10. *Hidden:* 5/10.
   - *Motive:* "The survivor. He smells the rain before it falls. If the Lords hit Woodlawn, he’s gone before the first shot."
2. **Marcus "Cole" Coleman** (Enforcer)
   - *Visible:* Loyalty 5/10. *Hidden:* 8/10.
   - *Motive:* "The loyalist. He’d burn the city to keep your corner warm, but his paranoia about Darius is a mounting liability."
3. **Tanya Rivers** (Informant)
   - *Visible:* Loyalty 7/10. *Hidden:* 6/10.
   - *Motive:* "The ghost. Skimming the tax-pot to build a life elsewhere. She's effective as long as the money flows."
4. **Starter Moves**: `TAX`, `WAR`, `GHOST`.

---

## 5. Scripted Opening
**⚡ EVENT: POWER_VACUUM_63RD**
> "The rain is washing the blood off 63rd and King, but it can’t wash away the sound of the silence. Your top lieutenant is in a bag, and the Governors’ old guard is panicking in the back of the diner.
> 
> The Lords in Englewood are already smelling the vacuum. Auburn Gresham is wide open, and the brass just handed you the keys to the corner.
> 
> Woodlawn is yours. For now. Don't let the weather fool you—it's about to get very hot."
