---
name: beyond-debug-log
description: Use when analyzing Miliastra/Genshin-TS runtime probe logs from Beyond_Debug_Log .gia files, especially when correlating game editor log entries with this project's gsts.config.ts playerId, injected map, and probe print markers.
---

# Beyond Debug Log

## Overview

Use this skill to inspect runtime node-graph logs produced by the Genshin/Miliastra editor. The debug log files live outside the repo and are selected by the `inject.playerId` in `gsts.config.ts`.

## Workflow

1. Read `gsts.config.ts` first and extract `inject.playerId`.
2. Resolve the log directory:
   `C:\Users\<user>\AppData\LocalLow\miHoYo\原神\BeyondLocal\<playerId>\Beyond_Debug_Log`
3. Pick the newest `.gia` file by `LastWriteTime`, unless the user provided an exact path.
4. Treat these `.gia` files as binary-ish debug log packages. Use `rg -a` or the helper script instead of normal text reading.
5. Search for project probes and adjacent values, especially `PROBE_`, `CHARGE_`, `打印`, and numeric values following marker logs.
6. Report the `playerId`, log file path, ordered trace, interpretation, and the next code/editor action.

## Helper Script

Run this from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .agents\skills\beyond-debug-log\scripts\analyze-beyond-debug-log.ps1
```

Useful options:

```powershell
powershell -ExecutionPolicy Bypass -File .agents\skills\beyond-debug-log\scripts\analyze-beyond-debug-log.ps1 -LogFile "C:\path\to\2026-06-09_15-54-48_1633_342478178.gia"
powershell -ExecutionPolicy Bypass -File .agents\skills\beyond-debug-log\scripts\analyze-beyond-debug-log.ps1 -Tail 120
powershell -ExecutionPolicy Bypass -File .agents\skills\beyond-debug-log\scripts\analyze-beyond-debug-log.ps1 -All
```

## Probe Meanings In This Project

- `PROBE_STAGE_INIT_DONE`: stage initialization reached the probe.
- `PROBE_DESTROY_FIRED`: a destroy/removal event fired.
- `PROBE_LEFT_CHECK`: the next numeric value is the current player count check.
- `PROBE_LEFT_FIRE`: player-left settlement fired.
- `PROBE_BOTH_JOINED`: `bothJoined` was set after both players were detected.
- `PROBE_SG_*`: settlement UI or settlement graph flow.
- `PROBE_OUT_FIRST`: first out-of-board chess handling; the next value is usually the chess type.
- `PROBE_OUT_REENTRY`: out-of-board handler re-entry was skipped or guarded.
- `CHARGE_BEGIN_RECV`: BeginCharge signal was received.
- `CHARGE_BEGIN_SELF`: BeginCharge matched the local player/character.
- `CHARGE_STOP_RECV`: StopCharge signal was received.
- `CHARGE_STOP_SELF`: StopCharge matched the local player/character; the next numeric value is usually `powerPercent`.
- `CHARGE_STOP_NOTCHARGING`: StopCharge arrived while `ischarge` was false.
- `LAND_LAUNCH_V0`: piece launch; next value is launch speed `v0 = initSpeed * powerPercent`.
- `LAND_PREDICT_DIST`: predicted landing distance computed at launch.
- `LAND_ACTUAL_DIST`: straight-line distance from launch position, printed when the piece stops.
- `LAND_PREDICT_DIST_AT_LAUNCH`: the prediction stored at launch, repeated at stop for pairing.
- `LAND_TRIGGER_COUNT`: collision count at stop; calibration samples are only valid when this is `0` and no wall bounce occurred.

## Reading Rules

- Do not rely on `output_log.txt` or `LocalLog.log` for node-graph `print` output. Those are useful for engine/load/network symptoms, but the editor-visible probe logs are normally in `Beyond_Debug_Log`.
- Do not assume the latest visible editor log belongs to the current repo unless its `playerId` directory matches `gsts.config.ts`.
- If `gsts.config.ts` has no `playerId`, list the directories under `BeyondLocal` and ask which player id to inspect.
- If a marker is followed by a bare number, preserve the adjacency in the report. For example, `CHARGE_STOP_SELF -> 0.02` means the stop path computed a low power percent.
- Print payloads sit after a record-prefix string that ends with `R` (seen as a standalone `R`, or merged like `@SR`). The bare `2` that appears after each timestamp is a metadata channel, not a print value — naive "first number after marker" pairing returns `2` for everything.
- Reliable marker/value pairing recipe: extract printable strings, keep only strings whose predecessor matches `R$` (these are payloads), then pair each `LAND_`/`PROBE_`/`CHARGE_` payload with the next numeric payload.
- Prefer a short timeline over raw dumps. Keep raw command output only when the user asks for it.
