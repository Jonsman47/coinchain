# AGENTS.md

This repository is for **Coin Chain**, a **desktop game app**.
Treat it as a small, focused, single-player game application.
It is **not** a generic website, SaaS app, dashboard, content site, or backend-heavy product.

## Product direction
- Build a **desktop app first**.
- Prefer **Tauri** for the desktop wrapper.
- If Tauri becomes impractical for the requested change, use **Electron** instead.
- The app should launch directly into the game.
- Favor a **single-window**, **single-main-screen** experience.
- Keep the game local-only unless explicitly told otherwise.

## Core design goals
- The game should feel **clean, immediate, readable, and satisfying**.
- Prioritize **clarity of mechanics** over quantity of systems.
- Difficulty should come from **meaningful interactions, space constraints, and planning**, not from confusion.
- The UI should feel like a **minimal indie game app**, not a business dashboard or website.
- Keep the player focused on the grid, the current resources, and the available actions.

## Scope control
Unless explicitly requested, do **not** add:
- auth or account systems
- online features or multiplayer
- analytics or tracking
- backend services
- multiple app pages/routes
- marketing pages
- achievements, battle pass, social systems, notifications
- a settings overhaul
- mobile support
- unnecessary libraries
- fake placeholder systems

When asked to add a feature:
- implement the **smallest complete version** that works well
- avoid speculative systems for future features unless they directly support the task
- do not silently expand scope

## Coding rules
- Keep code **modular, readable, and easy to extend**.
- Separate game logic, state, UI rendering, and utility code sensibly.
- Do not put the whole game into one giant file.
- Prefer simple deterministic logic over opaque cleverness.
- Avoid magic numbers unless they are named or clearly explained.
- Reuse existing patterns in the repo when reasonable.
- Do not rewrite large unrelated sections just because a cleanup seems nice.

## UI / UX rules
- The app should feel playable quickly.
- Minimize walls of text.
- Use plain-language labels for tiles, actions, and effects.
- Make critical information immediately visible.
- The main board should remain the visual focus.
- Hover/selection states should help the player understand what will happen.
- Avoid clutter, tiny unreadable text, and unnecessary panels.
- Prefer simple motion/feedback that improves readability.

## Gameplay rules
- Each new mechanic should be explainable in one short sentence.
- Prefer mechanics that combine well with existing ones.
- Prefer deterministic outcomes when possible.
- Preview outcomes when a player action has a meaningful consequence.
- If a rule is non-obvious, surface it clearly in the UI.
- Preserve the feel of a synergy/optimization puzzle.

## Change policy
Before changing code:
- inspect relevant files first
- understand the current structure
- patch carefully instead of rewriting blindly

After changing code:
- make sure the app still runs if possible
- do not leave broken partial integrations
- do not leave dead code or abandoned placeholders unless clearly marked and unavoidable

## Response expectations for Codex
At the end of each task:
- summarize what changed
- list the files created/edited
- mention any important tradeoffs or limitations
- provide the command(s) to run the app or verify the change

## Skills
When relevant, use the project skills in `.codex/skills`, especially for:
- desktop app setup and architecture
- minimal game UI decisions
- gameplay system implementation
- safe incremental changes
