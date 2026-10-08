# BareVault design

Terms are defined in [`CONTEXT.md`](../CONTEXT.md); technical decisions are in [`docs/adr/`](./adr). This document holds the game concept and scope. The work breakdown lives in GitHub issues.

## Purpose

A personal hobby project with two goals:

- Build a playable NetHack-style roguelike that the author actually plays.
- Learn new tools along the way: game programming for a web developer, and an AI-assisted workflow (agent skills, issue-driven development).

The name carries two meanings: the druid "bare" (bear form) of World of Warcraft, and "bare" as in empty, minimal, naked. Only the spirit of that theme is used (bear, wilderness, nakedness, vaults), with original names and art, so the game can be published without Blizzard material.

## Concept

The hero starts a run with nothing (bare start) and descends through generated levels. The exit of every level lies beyond a vault, a large guarded chamber holding enemies and gear. An unequipped hero is fragile, so each vault is a real risk with a real reward. The aim is to reach the greatest depth; there is no final objective.

## Rules

- Single player, turn-based: the hero acts, then every other actor acts. No speed or energy system.
- Permadeath: death ends the run and a new run starts from scratch.
- Gear comes only from vaults.
- Vaults are mandatory: the way down is behind them and they cannot be skipped.
- Levels are generated from a seed, so a seed reproduces a level.

## Presentation

Browser game drawn on a canvas with 16x16 pixel art tiles. Development starts with coloured-square placeholders; sprites are made later (Retro Diffusion MCP, a free asset pack or hand-drawn, to be decided when that work starts, with licences checked). Rendering is kept separate from game logic so the visual style can change.

## Technology

TypeScript, Vite and Vitest. The roguelike engine (grid, field of view, dungeon generation, pathfinding) is written from scratch in `src/engine`, test-first; BareVault-specific content lives in `src/game`. See ADR-0001 and ADR-0002.

## Out of scope for the first playable version

- Saving a run (state stays serializable so it can be added later)
- Bear form for the hero
- Speed or energy-based turn order
- A final objective or boss at the bottom
- Optional (skippable) vaults

## Open questions

- Whether bear form should become a mechanic, and how it would interact with gear.
- Whether a deeper end goal is wanted once the basic loop works.
- Where sprites come from.
- Line of sight uses one Bresenham line per tile, so it is not symmetric (A may see B while B does not see A) and lets sight slip through a diagonal gap between two walls. Fine while only the hero sees; revisit (e.g. shadowcasting) when enemies need to see the hero.
