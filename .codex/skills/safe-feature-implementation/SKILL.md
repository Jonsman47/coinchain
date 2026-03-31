---
name: safe-feature-implementation
description: Use this for any code change so features are added in small, safe, maintainable steps without breaking unrelated parts of the Coin Chain project.
---

# Safe Feature Implementation

This skill defines how to make changes safely and cleanly.

## Main goal
Implement the requested feature in the **smallest complete, working, maintainable way**.

## Workflow
1. Inspect the current relevant files.
2. Understand how the feature fits the existing structure.
3. Make a small implementation plan internally.
4. Patch the relevant files carefully.
5. Verify the result if possible.
6. Summarize exactly what changed.

## Rules
- Do not rewrite unrelated systems.
- Do not do broad refactors unless they are truly necessary for the task.
- Do not invent APIs, data sources, or systems that do not exist.
- Do not leave broken placeholders.
- Prefer finishing a smaller working version over starting a large incomplete one.
- Keep future extensibility in mind, but do not over-engineer.

## Code quality
- Keep changes localized when possible.
- Use clear names.
- Keep files focused.
- Remove obvious dead code created by the change.
- Add comments only when they genuinely improve clarity.

## Testing / verification
If the project supports it, run the relevant build or run command.
If a full run is not possible, at least verify the changed logic statically and avoid obvious breakage.

## Output format
At the end of the task, report:
- what was changed
- which files were created/edited
- how to run or verify it
- any limitations or follow-up notes

## Avoid
- Giant all-in-one patches
- speculative architecture
- unfinished scaffolding for features that were not asked for
- changing UI, gameplay, and infrastructure all at once unless the task truly requires it

## Final check
Before finishing, ask:
- Did I solve the exact request?
- Did I keep scope under control?
- Did I preserve the project’s desktop-game direction?
- Would the next Codex prompt still have a clean base to build on?
