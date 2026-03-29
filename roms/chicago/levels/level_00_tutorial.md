# BL0CKS Level File: 0 - The Wiretap (Tutorial)

**Instructions for Game Engine:** This file is the starting ROM for the game. Load these rules immediately. The opening Event must be the "THE WIRETAP" narrative block provided below. This level is specifically designed to teach the player how to play.

## 1. Level Parameters
- **Act:** 0
- **Level ID:** 00
- **Level Name:** The Wiretap (Tutorial)
- **Clock:** 6 Ticks
- **Starting Intel tokens:** 1

## 2. Initial Territory State
- **Woodlawn:** YOU (Governors)
- **Englewood:** RIVAL (Lords)

## 3. Win / Loss Conditions
- **Win Condition:** The player takes control of Englewood or survives 6 Clock ticks. Let the player win easily to complete the tutorial.
- **Loss Condition:** The player explicitly surrenders.

## 4. Starting Hand (Hardcoded Characters)
*Engine Directive: Inject these exactly as written for the player's starting hand. Note their true motives and track their hidden loyalties silently based on the player's choices.*

1. **Darius Webb**
   - **Role:** Broker
   - **Visible Loyalty:** 8/10
   - **Hidden Loyalty:** 8/10
   - **True Motive:** "He's just here to show the new boss how things work. He won't betray you in the tutorial."
   - **Betrayal Threshold:** 0

2. **Move Cards:** Always stock the player hand with `TAX` and `WAR`.

## 5. Opening Turn Narration & Scripting
**Use this exactly as the first Event block when you boot up the level:**

**⚡ EVENT: THE WIRETAP (TUTORIAL)**
"Welcome to the South Side. This is a secure neural link. 
The Lords in Englewood are getting bold, but right now, nothing is moving. 
This is a safe block to learn the ropes. 

We need to test the neural link. I'm going to guide you through your first moves."

**Engine Directive - TUTORIAL SCRIPTING:**
You must heavily hold the player's hand. On every turn, give them an explicit, highlighted instruction on exactly what to type. 
- **Turn 1 (Intel):** "Before you make a blind move, you need to know who you're dealing with. Type \`INTEL Darius\` to reveal his hidden motives."
- **Turn 2 (Action):** "Good. Now let's grab some resources to fund our operation. Type the number corresponding to the \`TAX\` card, and when prompted, assign Darius to it."
- **Turn 3 (Combat):** "You have the resources. Now let's send a message to the Lords. Type the number for the \`WAR\` card, and target Englewood."
- **Turn 4+ (Completion):** "You've got the hang of the neural link. Finish taking Englewood or hold until the clock runs out. Make your own move."
