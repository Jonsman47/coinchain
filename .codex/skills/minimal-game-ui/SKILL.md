---
name: minimal-game-ui
description: Use this skill when improving or rebuilding the UI of Coin Chain or similar desktop strategy/puzzle games that need to look minimal, premium, readable, and game-like instead of like a generic web app.
---

# Minimal Game UI Skill

## Purpose
This skill is for making the game UI look clean, premium, minimal, and actually like a polished desktop game.

Use it when:
- the UI looks flat, ugly, placeholder, or too “web app”
- the board does not feel like the visual centerpiece
- tiles do not feel tactile or satisfying
- panels/HUD/shop feel badly spaced or visually weak
- the game needs better polish without switching engines
- the goal is strong visual improvement with lightweight implementation

## Core design direction
Aim for:
- minimal but premium
- clean layout
- strong readability
- tactile tiles
- subtle depth
- polished motion
- good contrast
- desktop game feel, not admin dashboard feel

Do **not** make it:
- cluttered
- overly neon
- fake futuristic
- mobile-gacha style
- overdecorated
- dependent on heavy graphics tech unless truly needed

## Visual priorities
Always improve in this order unless there is a strong reason not to:
1. board centerpiece quality
2. tile look and interaction feel
3. HUD clarity and polish
4. selected/right-side panel polish
5. shop polish
6. feedback / animation / juice
7. background / ambience

## Board rules
The board should:
- be visually central
- feel premium and intentional
- have stronger material separation between frame and play area
- never look like a flat rectangle dropped on a page

Preferred direction:
- warm premium outer frame
- darker inner board
- subtle bevels, shadows, highlights
- slight gloss / panel feel
- readable grid without harsh lines

## Tile rules
Tiles should:
- feel square, tactile, and game-like
- have depth
- have clear silhouettes
- have readable iconography
- have obvious states for:
  - normal
  - hovered
  - pressed
  - selected
  - unaffordable
  - locked
  - disabled

Use lightweight polish such as:
- bevel highlights
- inner shadows
- soft outer shadow
- top-light gradient
- subtle lift on hover
- press-down on click
- clean selection glow or outline

## HUD and panel rules
HUD and side panels should:
- feel compact and premium
- have strong spacing and hierarchy
- avoid looking like raw debug boxes
- use consistent corner radii
- use consistent shadows
- clearly separate labels from values
- keep controls readable and satisfying

Buttons should:
- have a strong default state
- have clear hover/pressed/active/disabled states
- not feel mushy or random

## Shop rules
The shop should:
- feel integrated into the game scene
- clearly show selected / available / unaffordable / locked
- remain readable even when darkened
- not look like random colored buttons dumped below the board

## Motion rules
Use motion lightly but well.
Prefer:
- short, smooth easing
- hover lift
- press compression
- selection transition
- soft placement pop
- subtle pulse on activation
- smooth panel updates

Avoid:
- long slow animations
- constant distracting motion
- anything that makes gameplay harder to read

## Fake shader / polish methods
Prefer lightweight techniques over real heavy shaders:
- layered gradients
- inner shadow
- outer shadow
- bevel highlight
- gloss overlay
- vignette
- subtle ambient glow
- very subtle texture/noise
- restrained animated sheen if performance is fine

Do not introduce heavy rendering systems unless absolutely necessary.

## Implementation rules
- build directly on the existing Electron + Vite + TypeScript implementation
- do not switch stacks
- do not refactor unrelated files unless needed
- keep performance acceptable in the real packaged app /.exe
- verify changes in the packaged runtime, not only in dev mode
- preserve gameplay readability over visual excess

## Coin Chain specific direction
For Coin Chain specifically:
- background should stay warm / coin-like
- board should stay centered
- board should feel like the main visual focus
- tiles should feel tactile and slightly 3D
- HUD should stay compact at the top
- right-side selected panel should stay clean and readable
- shop should stay under the board but look much better integrated

## What good output looks like
A successful result should feel:
- cleaner immediately at first glance
- much more premium
- more like a real shipped game
- more satisfying to click and place in
- still simple and readable
- clearly improved in the actual packaged .exe

## Checklist before finishing
Before considering the task done, verify:
- board looks meaningfully better
- tiles look tactile
- selected/locked/unaffordable states are clear
- HUD and side panels feel polished
- shop feels integrated
- interactions feel better
- no major readability regression happened
- packaged app /.exe was updated and checked