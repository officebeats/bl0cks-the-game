# {{ROM_NAME}} — BL0CKS Custom ROM

> Built with the [BL0CKS Engine](https://github.com/officebeats/bl0cks-the-game)

## Quick Start

1. Replace all `{{PLACEHOLDER}}` values in every file
2. Run `bl0cks rom validate ./` to check your ROM
3. Test locally: `bl0cks play ./`
4. Publish: `bl0cks market publish ./`

## File Structure

```
your-rom/
├── manifest.json          ← ROM metadata and content declarations
├── world/
│   ├── factions.md        ← Define your power structures
│   └── territories.md     ← Define your map
├── levels/
│   └── level_01_*.md      ← Playable levels (add as many as you want)
├── cards/
│   └── templates/         ← Card generation templates
├── prompts/
│   ├── system.md          ← Game engine behavior
│   └── narrator.md        ← Narrative voice and tone
├── assets/
│   └── theme.json         ← Colors, typography, visual identity
└── README.md              ← This file
```

## Tips

- **Levels:** Name files `level_NN_slug.md` and register them in `manifest.json`
- **Factions:** Aim for 3-5 factions with distinct mechanical hooks
- **Territories:** 6 territories is the sweet spot for 20-minute sessions
- **Narrator:** The more specific your narrator prompt, the better the AI voice
- **Theme:** Color tokens affect the CLI and web client rendering
