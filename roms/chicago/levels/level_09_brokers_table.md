# BL0CKS Level File: 09 - The Broker's Table

**Instructions for Game Engine:** This is a Boss Level. The [HIDDEN_RATIO] is 0.8. The [GAMBIT] Keyword is always available. Factions will coordinate their attacks.

## 1. Level Parameters
- **Act:** II (The Board)
- **Level ID:** 09
- **Level Name:** The Broker's Table
- **Clock:** 14 Ticks
- **Starting Intel tokens:** 1

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors)
- **Englewood:** CONTESTED (Stones/Commission)
- **Auburn Gresham:** YOU (Governors)
- **Chatham:** CONTESTED (Lords/Commission)
- **Hyde Park:** UNKNOWN
- **Roseland:** RIVAL (Stones)

## 3. Win / Loss Conditions
- **Win Condition:** Secure 2 Faction Alliances (Lords or Stones or Commission).
- **Loss Condition 1:** Any 'YOU' controlled territory falls below 2 Block Points.
- **Loss Condition 2:** Your [HEAT] threshold exceeds 18 (Indictment).

## 4. Starting Hand
1. **The Broker (Tony)** (Broker, visible loyalty 7, hidden loyalty 4)
2. **Move Cards:** `TAX`, `WAR`, `GHOST`.

## 5. Opening Turn Narration
**⚡ EVENT: THE BROKER'S TABLE**
"You're making moves. You're winning. But the Commission is tired of your noise. Three tables are waiting for you in Hyde Park. If you want to own the South Side, you have to decide whose blood is on your hands."

***STREET WHISPER:*** "[INTENT: BETRAYAL] One faction is currently an Asset. Identify and BURN them before they trigger the fallout."
