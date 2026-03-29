# {{ROM_NAME}} — Level 1: {{LEVEL_NAME}}

**Instructions for Game Engine:** This is the starting level. Load these rules and begin the game.

## 1. Level Parameters
- **Act:** I
- **Level ID:** 01
- **Level Name:** {{LEVEL_NAME}}
- **Clock:** 12 Ticks
- **Starting Intel tokens:** 2

## 2. Initial Territory State
- **{{TERRITORY_1}}:** YOU ({{FACTION_1}})
- **{{TERRITORY_2}}:** RIVAL ({{FACTION_2}})
- **{{TERRITORY_3}}:** CONTESTED
- **{{TERRITORY_4}}:** NEUTRAL
- **{{TERRITORY_5}}:** RIVAL ({{FACTION_3}})
- **{{TERRITORY_6}}:** CONTESTED

## 3. Win / Loss Conditions
- **Win:** Control {{TERRITORY_3}} before the Clock reaches 12.
- **Loss:** Lose {{TERRITORY_1}} to a Rival or neutral force intervention.

## 4. Starting Hand
1. **{{CHARACTER_1}}**
   - **Role:** Broker
   - **Visible Loyalty:** 7/10
   - **Hidden Loyalty:** 5/10
   - **True Motive:** "{{HIDDEN_MOTIVE}}"
   - **Betrayal Threshold:** 3

2. **{{CHARACTER_2}}**
   - **Role:** Enforcer
   - **Visible Loyalty:** 5/10
   - **Hidden Loyalty:** 8/10
   - **True Motive:** "{{HIDDEN_MOTIVE}}"
   - **Betrayal Threshold:** 2

3. **Move Cards:** TAX, WAR

## 5. Opening Narration
**⚡ EVENT: {{EVENT_NAME}}**
"{{OPENING_NARRATIVE}}"
