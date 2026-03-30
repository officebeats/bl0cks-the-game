#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ROM Audio Generator Tool
 * Generates an MP3 asset for a ROM using Lyria 3 (via Gemini API).
 * It leverages the 'rom_audio_prompt' skill to craft the perfect prompt first.
 * 
 * Usage:
 *   GEMINI_API_KEY="AIza..." node tools/generate-audio.mjs --rom ./roms/chicago
 */

async function main() {
  let apiKey = process.env.GEMINI_API_KEY;
  let isMock = false;

  if (!apiKey || !apiKey.startsWith('AIza')) {
    console.warn('[Warning] No GEMINI_API_KEY found in environment. Running in MOCK/TEST mode.');
    isMock = true;
  }

  const romArg = process.argv.findIndex(a => a === '--rom');
  const levelArg = process.argv.findIndex(a => a === '--level');
  
  if (romArg === -1 || !process.argv[romArg + 1]) {
    console.error('Usage: node generate-audio.mjs --rom <path/to/rom> [--level <number>]');
    process.exit(1);
  }
  
  const romPath = resolve(process.argv[romArg + 1]);
  const isLevel = levelArg !== -1 && process.argv[levelArg + 1];
  const levelTarget = isLevel ? String(process.argv[levelArg + 1]).padStart(2, '0') : null;
  const targetFileName = isLevel ? `level-${levelTarget}.mp3` : 'title-screen.mp3';

  const manifestPath = join(romPath, 'manifest.json');
  const themePath = join(romPath, 'assets', 'theme.json');
  
  if (!existsSync(manifestPath)) {
    console.error(`[Error] No manifest.json found at: ${manifestPath}`);
    process.exit(1);
  }

  console.log(`🎵 Reading ROM assets for ${isLevel ? 'Level ' + levelTarget : 'Title Screen'}...`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const theme = existsSync(themePath) ? JSON.parse(readFileSync(themePath, 'utf8')) : {};
  
  // Gather context
  const romContext = {
    title: manifest.name,
    description: manifest.description,
    tags: manifest.tags,
    branding: manifest.branding,
    colors: theme.colors,
    factions: theme.factions,
    specificLevelFocus: isLevel ? `Generate a track specifically tailored for LEVEL ${levelTarget}` : null,
  };

  if (isLevel) {
    const levelDocPath = join(romPath, 'prompts', `level-${levelTarget}.md`);
    if (existsSync(levelDocPath)) {
      romContext.levelLore = readFileSync(levelDocPath, 'utf8').substring(0, 1500); // snippet
    }
  }

  // 2. Load the prompt generation skill
  console.log('🧠 Loading "rom_audio_prompt" skill...');
  const skillPath = resolve('.agents/skills/rom_audio_prompt/SKILL.md');
  const skillText = existsSync(skillPath) 
    ? readFileSync(skillPath, 'utf8') 
    : 'You are an expert music producer. Create a 1-sentence prompt for a Lyria 3 music gen model based on this ROM.';

  // 3. Generate the audio prompt using Gemini Flash
  console.log('✨ Crafting optimal Lyria 3 prompt using Gemini...');
  const genAI = new GoogleGenerativeAI(apiKey);
  let audioPrompt = '';

  if (isMock) {
    audioPrompt = isLevel 
      ? `A tense, evolving 95 BPM crime-drama level tracker for Level ${levelTarget}. Driving hi-hats, subtle bass stabs, immersive city sounds, and increasing urgency as the turn clock ticks down.`
      : "A gritty, 85 BPM lo-fi boom-bap hip-hop instrumental. Features dark, melancholic piano chords, a heavy sub-bass, sparse distant sirens, and a tense urban night atmosphere with vinyl crackle.";
  } else {
    const flashModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: skillText
    });
    
    const chatContext = `Here is the ROM data to analyze:\n\n${JSON.stringify(romContext, null, 2)}`;
    const promptResult = await flashModel.generateContent(chatContext);
    audioPrompt = promptResult.response.text().trim();
  }
  
  console.log('\n================================');
  console.log('🎧 GENERATED LYRIA PROMPT:');
  console.log(`> "${audioPrompt}"`);
  console.log('================================\n');

  // 4. Generate audio via Lyria 3 REST API
  console.log(`📻 Requesting 30-second audio track from lyria-3-clip-preview...`);
  
  let base64Audio = '';
  if (isMock) {
    console.log('[MOCK] Skipping real network request to Lyria API.');
    // Generate 1 second of silent MP3 base64 or a dummy string
    base64Audio = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAA'; 
  } else {
    const lyriaUrl = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent?key=${apiKey}`;
    
    const lyriaResponse = await fetch(lyriaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: audioPrompt }] }],
        generationConfig: { responseModalities: ["AUDIO"] }
      })
    });

    if (!lyriaResponse.ok) {
      const err = await lyriaResponse.text();
      console.error('[Error] Lyria API failed:', err);
      process.exit(1);
    }

    const lyriaData = await lyriaResponse.json();
    const candidates = lyriaData.candidates || [];
    if (!candidates.length || !candidates[0].content) {
      console.error('[Error] Unexpected response format from Lyria:', lyriaData);
      process.exit(1);
    }

    const parts = candidates[0].content.parts;
    const audioPart = parts.find(p => p.inlineData);
    
    if (!audioPart) {
      console.error('[Error] No audio data returned by Lyria.');
      process.exit(1);
    }
    base64Audio = audioPart.inlineData.data;
  }

  // 5. Decode base64 and save MP3
  const outDir = join(romPath, 'assets', 'audio');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  
  const outFile = join(outDir, targetFileName);
  const buffer = Buffer.from(base64Audio, 'base64');
  writeFileSync(outFile, buffer);

  console.log(`✅ Success! Audio saved to: ${outFile}`);
}

main().catch(console.error);
