# Instructions for Claude Code — Spotted

Read **SPEC.md** before doing anything. It is the source of truth for what to build.

## About me
- I am a beginner. I don't code. Explain what you're doing in plain, simple words.
- Before running anything that installs, deletes, or costs money, tell me what it does and wait for my OK.
- When I need to do something myself (click in a website, scan a QR code, test on my phone), give me numbered steps.

## How to work
- Build ONE feature at a time from SPEC.md. Stop when it works and tell me how to test it.
- Keep Version 1 small. Don't add features that are listed as "Out of scope".
- After each working feature, run `npm run check` (type-check + automatic tests), then commit to Git with a short clear message and push to GitHub.
- When fixing a bug, add a test in `tests/` that would have caught it.
- If something fails, explain the error simply, fix it, and tell me what went wrong.

## Tech rules
- Expo (React Native) + TypeScript, Expo Router for navigation.
- Store data on the phone only (no backend) in Version 1. Sign-in is a **local demo**: the SMS is fake (code `123456`) and sits behind `src/services/auth.ts`. Real login, SMS and a server are Version 2.
- Use local notifications only.
- Never scrape Instagram or TikTok, and never read comments. Only use official public services (like TikTok oEmbed) or text the user pastes. Users always confirm places.
- Geofencing: watch at most the 20 nearest saved places; refresh on significant location change.
- Secrets go in `.env` (never commit it). Keep `.env.example` with empty values.
- Keep code simple and well-commented so a beginner can follow it.

## Design
- Clean and friendly. **Purple brand** (light `#6A1FB0`, dark `#A061F0`), Poppins font. SPEC.md section 10 has all the colours. The visual source of truth is `spotted-prototype-reference.html`.
- Colours are in `constants/Theme.ts`. Read them with `useTheme()` from `src/theme/ThemeProvider.tsx`. The older screens read the same purple colours through `constants/Colors.ts`.
- Support light and dark mode. Large tap targets (at least 44 x 44). Respect Reduce Motion in every animation.
- **Never use eyes, faces or any human features** in icons, illustrations or animations.
- **Do not use emoji in the UI** anywhere (a test checks every file). Use the icons in `src/components/icons`.

## Before store submission, always check
- Location permission text is clear and explains background use.
- App doesn't crash when location or notifications are refused.
- "Delete all my data" works.
- Privacy policy link is in Settings.
