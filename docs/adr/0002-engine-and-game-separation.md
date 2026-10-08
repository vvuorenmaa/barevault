# Engine and game live in one repo, engine never imports game

`src/engine` holds generic roguelike mechanics, `src/game` holds BareVault-specific content such as vaults. `engine` must never import from `game`, and engine logic uses a seeded random number generator and plain serializable state so it stays testable and savable. A monorepo with separate packages was rejected as configuration overhead; extract the engine later if it earns it.
