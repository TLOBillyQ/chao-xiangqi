# Chess Catapult (超象棋：弹射)

> Depends on [genshin-ts](https://github.com/josStorer/genshin-ts); read-only mirror on this instance: [miliastra/genshin-ts](http://lzxsvn:3000/miliastra/genshin-ts).

A Genshin UGC (千星奇域) project built with genshin-ts. Write chess catapult gameplay logic in TypeScript, compile to node graphs, and inject into maps.

## Quick Start

```bash
npm install
npm run dev
```

Documentation: `https://gsts.moe/zh`

## Project Structure

- `src/`: source code (entry files and modules)
- `gsts.config.ts`: compile and output configuration
- `dist/`: build outputs (`.gs.ts` / `.json` / `.gia`)
- `docs/EDITOR_BOUNDARIES.md`: code vs. editor responsibility guide
- `docs/EDITOR_BOUNDARIES_ZH.md`: Chinese version of editor boundaries
- `CLAUDE.md` / `AGENTS.md`: AI collaboration guidelines

## Inject Configuration (Optional)

```ts
import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 1,
    mapId: 1073741849,
    nodeGraphId: 1073741825
  }
}

export default config
```

Tips:

- Run `npm run maps` to list recently saved maps and find the correct `mapId`.
- Set `gameRegion` / `playerId` for multi-account or multi-server setups.
- Injection creates automatic backups for easy rollback.

## Editor Boundaries

This project follows a "code-first" approach, but Genshin UGC still requires some manual editor configuration.

- **Code handles**: runtime rules — game flow, state machines, wave logic, economy, validation, spawning, settlement, signal orchestration.
- **Editor handles**: assets and configuration — prefabs, components, paths, UI layout/control groups, signals, global timers, shops, currency, ability units, text bubbles, minimap markers, audio resources, etc.
- Before designing or implementing features, check `docs/EDITOR_BOUNDARIES.md` and clearly separate code changes from editor setup.

## Scripts

- `npm run build`: full compile
- `npm run dev`: incremental compile (auto-injects if configured)
- `npm run maps`: list recently edited maps
- `npm run backup`: open injection backup directory
- `npm run typecheck`: TypeScript type checking
- `npm run lint`: ESLint

## FAQ

- `npm run maps` returns empty: save the map in the editor first, then retry.
- Injection fails: verify `mapId` / `nodeGraphId` are correct and graph types match.
- Type errors: check `.value` usage and pin type alignment first.
