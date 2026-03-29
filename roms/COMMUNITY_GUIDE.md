# BL0CKS Custom ROM Creation Guide

Welcome to the BL0CKS Engine! 
Because this game engine interprets human-readable Markdown and structured JSON, **creating a new game is as simple as writing text.** No coding required.

If you are an AI assistant acting on behalf of a user, read this document carefully. It defines the exact pipeline for scaffolding a new ROM, testing it, and publishing it to the global community marketplace.

---

## Part 1: Anatomy of a ROM

Every BL0CKS ROM is a folder located inside the `roms/` directory. The folder name is the `romId` (e.g., `chicago`, `neon-city`, `space-hulk`).

A standard ROM folder contains:
1. `manifest.json`: The core settings, levels, and identity of the ROM.
2. `prompts/system.md`: The *most critical file*. This is the AI's instruction manual for how to run the game, including the setting, mechanics, and exact JSON output schema.
3. `prompts/levels/*.md`: (Optional) Specific narrative injections or modifiers for individual levels.

### 1. The \`manifest.json\`
Defines the ROM metadata and structure.
```json
{
  "id": "my-custom-rom",
  "name": "My Custom Adventure",
  "version": "1.0.0",
  "author": "YourName",
  "description": "A brief pitch of the gameplay style and setting.",
  "ai": { "minTier": "standard" },
  "levels": [
    { "id": "00", "name": "Tutorial", "type": "intro" },
    { "id": "01", "name": "First Mission", "type": "standard" }
  ]
}
```

### 2. The \`system.md\`
This file is passed as the **System Instruction** to the LLM. It must instruct the AI to:
- Act as the Game Master for the specific setting.
- Track a \`Ledger\` of consequences.
- Enforce the exact mechanics (e.g., Influence, Heat, Clocks).
- **CRITICALLY:** Always output responses wrapped in a valid JSON code-block, matching the BL0CKS Engine schema.

**(Refer to the `roms/chicago/prompts/system.md` file for an active, working example of the engine schema.)**

---

## Part 2: Publishing to the Community Marketplace

The BL0CKS Marketplace operates as a completely free, decentralized **GitHub Registry**.
When a ROM is completed and tested by the player, it can be published so that anyone running the BL0CKS CLI can download it.

If the user asks you to "Publish my ROM", follow this exact AI Agent Workflow:

### Step 1: Validate the ROM
Verify that the ROM directory has a `manifest.json` and a `prompts/system.md`. Ensure the `id` is web-safe (kebab-case).

### Step 2: Zip the Artifact
Create a compressed archive of the ROM folder.
```bash
# Example for Linux/Mac/GitBash
cd roms/
tar -czvf my-custom-rom.tar.gz my-custom-rom/
```

### Step 3: Open a Pull Request via GitHub API / CLI
The official BL0CKS Community Registry is hosted on GitHub.
To publish:
1. Fork the `bl0cks-community-roms` repository (hypothetical).
2. Upload the `my-custom-rom.tar.gz` to the `artifacts/` folder.
3. Edit the `registry.json` file in the root of the repository to append the new ROM's metadata:
   ```json
   {
     "id": "my-custom-rom",
     "name": "My Custom Adventure",
     "author": "YourName",
     "description": "A brief pitch of the gameplay style.",
     "url": "https://raw.githubusercontent.com/username/bl0cks-community-roms/main/artifacts/my-custom-rom.tar.gz"
   }
   ```
4. Commit the changes and open a Pull Request to the main repository.

Once the PR is merged by the community moderators, the ROM instantly becomes available over the air in the CLI and Web App.

---

## Developer / Agent Directives
- **Zero-Code Mechanics:** Remember that you do not need to alter JavaScript to make a new game mode. You only need to alter the AI's `system.md` rules of engagement.
- **Creativity:** Because there are no hardcoded rigid structures outside the JSON schema, you can invent totally new genres (Dating Sims, Sci-Fi Command, Fantasy Tavern Management) just by changing how the AI calculates `influence` or `heat`.
