/**
 * BL0CKS CLI — Splash Screen & Tutorial
 * 
 * Boot animation and guided tutorial for first-time players.
 */

import { renderSplash, renderMenu, A } from './renderer.js';
import { clear, showAnimatedPrompt } from './input.js';

/**
 * Play the boot splash animation.
 * @param {number} [frames=70] - Number of animation frames
 */
export async function playSplash(frames = 70) {
  clear();
  for (let f = 0; f < frames; f++) {
    process.stdout.write('\x1b[H');
    console.log(renderSplash(f));
    await new Promise(r => setTimeout(r, 70));
  }
}

/**
 * Run the interactive tutorial (Level 00: The Wiretap).
 * Teaches core mechanics: Intel, Tax, War.
 */
export async function runTutorial() {
  await showAnimatedPrompt(
    "NEURAL LINK: WIRETAP (TUTORIAL)",
    "Connection secured to the South Side.\nThe Lords in Englewood are getting bold, but nothing is moving.\nThis is a safe block to learn the ropes.\n\nPress Enter to begin:",
    renderMenu
  );

  // Step 1: Intel
  while (true) {
    const res = await showAnimatedPrompt(
      "NEURAL LINK: WIRETAP",
      "First, you need to know who you're dealing with.\nDarius Webb is your Broker, but what is his true motive?\n\nType 'INTEL Darius' to inspect your asset:",
      renderMenu
    );
    if (res.toLowerCase().trim() === 'intel darius') break;
  }

  await showAnimatedPrompt(
    "NEURAL LINK: WIRETAP",
    ">> INTEL ACQUIRED <<\nDARIUS WEBB [Broker]\nVisible Loyalty: 8/10\nHidden Motive: Terrified of the Lords. Will sell you out if they attack.\n\nPress Enter to continue:",
    renderMenu
  );

  // Step 2: Tax
  while (true) {
    const res = await showAnimatedPrompt(
      "NEURAL LINK: WIRETAP",
      "Good. Now let's grab some resources.\nYou have 2 action cards in your hand: [1] TAX and [2] WAR.\n\nType '1' to play the TAX card:",
      renderMenu
    );
    if (res.trim() === '1') break;
  }

  while (true) {
    const res = await showAnimatedPrompt(
      "NEURAL LINK: WIRETAP",
      "TAX Card Played.\nWho do you want to send on the run?\n\nType 'Darius' to select him:",
      renderMenu
    );
    if (res.toLowerCase().trim() === 'darius') break;
  }

  await showAnimatedPrompt(
    "NEURAL LINK: WIRETAP",
    ">> TAX COLLECTED <<\nDarius collected resources from Woodlawn.\nYour operation is funded.\n\nPress Enter to continue:",
    renderMenu
  );

  // Step 3: War
  while (true) {
    const res = await showAnimatedPrompt(
      "NEURAL LINK: WIRETAP",
      "Time to send a message.\n\nType '2' to play the WAR card:",
      renderMenu
    );
    if (res.trim() === '2') break;
  }

  while (true) {
    const res = await showAnimatedPrompt(
      "NEURAL LINK: WIRETAP",
      "WAR Card Played.\nWhich block are you targeting?\n\nType 'Englewood' to attack the Lords:",
      renderMenu
    );
    if (res.toLowerCase().trim() === 'englewood') break;
  }

  await showAnimatedPrompt(
    "NEURAL LINK: WIRETAP",
    ">> WAR DECLARED <<\nEnglewood is yours. The Lords are falling back.\nTutorial Complete. You are ready for the streets.\n\nPress Enter to boot Level 1:",
    renderMenu
  );
}
