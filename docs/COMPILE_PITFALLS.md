# Compile & Injection Pitfalls

Gotchas in the chao-xiangqi compile/inject flow that are easy to hit and hard to self-diagnose.

Language note:
- When working in English, read this file.
- When working in Chinese, use `docs/COMPILE_PITFALLS_ZH.md` (preferred for Chinese terminology).

## 1. `g.server` `name` must differ from the source file name

**Symptom**: You give a node graph an English `name`, but after injection the editor shows `_GSTS_src` (the folder name) instead of your name.

**Cause**: The compiler treats a `name` equal to the source file name as the runner's auto-generated default and discards it. The check is `isExplicitGraphNameForSource()` in `node_modules/genshin-ts/dist/src/compiler/ir_merge.js`: after stripping the `_GSTS_` prefix, if `name` (case-insensitive) equals the source file's basename, it is considered "non-explicit" and the merge falls back to the folder name.

**Example**: file `ChessInit.ts` + `name: 'ChessInit'` → falls back to `_GSTS_src`; changing it to `name: 'ChessInitGraph'` correctly yields `_GSTS_ChessInitGraph`.

**Fix**: Give `g.server`'s `name` a value distinct from the file name (add a suffix like `XxxGraph`, or use a display name). Note `name` is only the editor display label; the real identity is `id`, so renaming does not affect logic or injection mapping.

## 2. `npm run dev` incremental builds leave stale dist artifacts

**Symptom**: After renaming or deleting a source file, you hit a same-`id` conflict or a wrong graph name during compile/inject.

**Cause**: `dev` is an incremental build and does **not** delete dist artifacts for renamed/removed source files. The stale `.json` collides with the new file on the same `g.server` id.

**Example**: After renaming `Gameinit.ts` to `ChessInit.ts`, `dist/src/Gameinit.json` (id 1073741842) lingers and collides with the new `ChessInit.json` on the same id.

**Fix**: After renaming or deleting source files, run `rm -rf dist` then `npm run build` for a full rebuild before injecting. `dist` is generated output and safe to delete (`CLAUDE.md` also forbids hand-editing `dist`).

## 3. Injecting while the editor has the map open gets overwritten by the editor's save

**Symptom**: Injection succeeds (logs all green, scanning the save finds the injected content), but the new feature does nothing in playtest; scanning the save again later shows every injected graph, custom variable, and print is gone — only editor-authored resources (UI controls, camera templates) remain.

**Cause**: Once the editor opens a map it holds the whole level in memory. Injection only modifies the `.gil` on disk; the editor never notices. The next editor save (triggered by starting a playtest, leaving the map, etc. — fingerprint: `.gil`, `Beyond_Local_Save_Player.gip`, and the `Temp\` copies all written in the same second) writes the stale in-memory state back to disk, reverting everything injected. Playtest also runs from the in-memory state, so "re-open the playtest after injecting" both fails to pick up the feature and destroys the on-disk injection.

**Example**: 2026-06-10 "switch-camera button dead" hunt: at 21:46 the injected `isVerticalCam` and button-branch constant were scannable in the save; after the editor's 21:59:20 save they were all gone — the button did nothing, and with 0 prints in the running graphs no `Beyond_Debug_Log` file was even created.

**Fix**: Before injecting, fully leave the map in the editor (back to the map list/home), then `npm run build`, then re-open the map. To check for a clobber: scan the `.gil` for a code-only string (e.g. a custom variable name); `.gil`+`.gip`+`Temp` written in the same second is the editor-save fingerprint.
