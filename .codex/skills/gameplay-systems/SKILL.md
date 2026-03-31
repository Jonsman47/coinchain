---
name: gameplay-systems
description: Use this when implementing or changing grid logic, tile behaviors, cycle resolution, resource generation, progression rules, and general game mechanics in Coin Chain.
---

# Gameplay Systems

This skill governs how mechanics should be implemented for Coin Chain.

## Main goal
Keep the systems **simple to understand**, **satisfying to combine**, and **easy to expand**.

## Core philosophy
- Start simple.
- Add depth through interactions.
- Prefer fewer better mechanics.
- Make cause and effect readable.
- Let difficulty come from planning and board constraints.

## Rules for mechanics
- Each tile or mechanic should be explainable in one short sentence.
- Favor deterministic logic over random hidden logic unless randomness is a deliberate feature.
- If multiple resolution orders are possible, choose a clear and stable rule.
- Surface important rules in the UI.
- Avoid hidden penalties that feel unfair.

## Economy / output rules
- Keep numbers readable.
- Avoid explosive scaling too early.
- Make it easy to understand why output changed.
- Prefer additive and adjacency-based interactions early.
- Introduce more advanced interactions only after the base loop is solid.

## Board and placement rules
- Placement should matter.
- Constraints should create interesting decisions.
- Blocked cells, adjacency, orientation, and limited space are good sources of depth.
- Avoid fake choice where every placement is obviously equivalent.

## Progression rules
When progression is introduced:
- unlock mechanics gradually
- teach one idea at a time
- escalate complexity slowly
- avoid dumping many new rules at once

## Code rules
- Keep tile definitions and effect logic organized.
- Separate simulation logic from UI rendering.
- Make it easy to add future tiles without rewriting core logic.
- Avoid copy-pasting large branches of special-case logic.

## Avoid
- Overly abstract resource webs too early
- Hard-to-follow hidden formulas
- Feature creep disguised as depth
- Mechanics that sound cool but are not readable in play
- Large balancing systems before the core loop feels good

## Final check
Ask:
- Can the player understand why they won or failed?
- Does the mechanic create real planning?
- Is the interaction satisfying without needing fancy graphics?
- Will this still be easy to build on in future prompts?
