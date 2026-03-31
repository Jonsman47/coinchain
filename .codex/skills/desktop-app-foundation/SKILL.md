---
name: desktop-app-foundation
description: Use this when creating or modifying the desktop app shell, startup flow, app architecture, or deciding how Coin Chain should behave as a desktop game app rather than a website.
---

# Desktop App Foundation

This skill defines how to build and maintain Coin Chain as a **desktop game app**.

## Main goal
Keep the project feeling like a **small launchable game application**, not a browser product with a lot of web-app baggage.

## Priorities
1. Prefer **Tauri** for the desktop wrapper.
2. If Tauri becomes impractical for the requested change, use **Electron** instead.
3. Launch directly into the game.
4. Keep the app structure simple and maintainable.
5. Avoid architecture that implies unnecessary routing, backend complexity, or multi-page product flows.

## Rules
- Treat the main game screen as the primary product surface.
- Prefer a single main window.
- Keep startup fast and simple.
- Avoid introducing a complex route system unless explicitly needed.
- Default to local-only behavior.
- Keep filesystem, storage, or native integration minimal unless required.

## Good patterns
- A clear app entry point
- A clear separation between desktop wrapper concerns and game UI logic
- A simple folder structure that supports incremental growth
- Local persistence only when explicitly requested

## Avoid
- Building a generic website first and wrapping it later without structure
- Adding auth, backend, or cloud systems by default
- Adding menu/page structures that dilute the game-first flow
- Overcomplicating packaging before the core game works

## When implementing
- Inspect the existing app setup first
- Keep the desktop-specific code isolated from gameplay logic where possible
- Prefer the smallest working wrapper that launches reliably

## Final check
When done, ensure the result still behaves like this:
- user launches app
- user lands in the game quickly
- the app feels focused, local, and self-contained
