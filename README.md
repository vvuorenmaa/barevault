# BareVault

A turn-based roguelike for the browser. You start a run with nothing, descend level by level, and equip yourself from the vault that guards each level's exit. Death is permanent.

Status: early development. You can explore a generated dungeon and fight the two enemies guarding the farthest room, and pick up a weapon and armor (placed next to you for now), but the vault has no loot and there are no further levels yet. See [issues](https://github.com/vvuorenmaa/barevault/issues) for the roadmap.

## Controls

- Arrow keys: move; moving into an enemy attacks it
- Space or `.`: wait a turn
- `?seed=name` in the URL picks the dungeon

## Documentation

- [`docs/design.md`](docs/design.md): concept, rules and scope
- [`CONTEXT.md`](CONTEXT.md): project vocabulary
- [`docs/adr/`](docs/adr): architecture decisions
- [`docs/agents/`](docs/agents): issue tracker, triage labels and domain-doc conventions for AI agents

## Tech

TypeScript, Vite and Vitest, with a hand-written roguelike engine and canvas pixel art rendering.

## Development

Requires Node 22 (see `.nvmrc`; with nvm run `nvm use`).

```sh
npm install
npm run dev        # start the dev server
npm test           # run the unit tests
npm run lint       # lint (also enforces that src/engine never imports src/game)
npm run typecheck  # type-check without emitting
npm run build      # type-check and build for production into dist/
```

Source layout: `src/engine` holds generic roguelike mechanics, `src/game` holds BareVault-specific content (see [ADR-0002](docs/adr/0002-engine-and-game-separation.md)).
