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

No probes are active in the current build (all removed after the 2026-06-11 switch-camera diagnosis). The sections below decode historical logs.

Switch-camera diagnosis probes (only in logs from 2026-06-10/11 builds):

- `PROBE_UIBTN_groupIndex` / `PROBE_UIBTN_compositeIndex`: fired at `whenUiControlGroupIsTriggered` entry for EVERY UI control event; the next numeric payload is the index. A button ID never appearing here means the editor never emitted the interaction event for it (e.g. 按键类型 not 交互事件).
- `PROBE_CAM_ENTER` / `PROBE_CAM_GOT_VAR` / `PROBE_CAM_NAME` / `PROBE_CAM_SWITCH_DONE`: progress through the old `switchMainCameraTemplate`-based switch-camera branch; the payload after `PROBE_CAM_NAME` is the camera template name.
- `PROBE_CAM3_ENTRY`: the rewritten branch using `setPlayerCameraToFollowEntity`; the next payload is the 物件镜头 entry name passed (玩家N镜头 / 物件镜头_2).
- `PROBE_SCAN_*`: user-side btn_test dump checking whether a ScanEntity follows the player (positions/distance/tag payloads).

Leave-settlement diagnosis probes (only in logs from 2026-06-10 builds):

- `PROBE_TICK_LEN`: 3s timer tick; the next three numeric payloads are, in order: `getListOfPlayerEntitiesOnTheField().length` / typed `EntityType.Player` count / typed `EntityType.Character` count. `1/2/2` means the legacy player-list node undercounts; `1/1/1` with a visible opponent means the server never saw player 2; after a quit, stuck `2/x/x` means a ghost player entity.
- `PROBE_EVT_LEN`: an entity removed/destroyed event fired (pre-settlement); the next numeric payload is the player-list length at that moment.
- `PROBE_ONE_LEFT_NOT_JOINED`: removal event saw exactly 1 player while `bothJoined` was false (expected in solo; in duo it means full-room confirmation failed).
- `PROBE_BOTH_JOINED`: `bothJoined` was set after both players were detected (mirrors on-screen toast `探针:对局满员`).
- `PROBE_SG1_ENTER` / `PROBE_SG3_BUTTONS`: progress inside `gstsServerSettleGame` (1 = entered, 3 = per-player UI loop finished); SG1 without SG3 means the UI loop aborted mid-way (mirrors toasts `探针:SG1/SG3`).
- `PROBE_ABSENT_FIRE`: opponent-absent timeout (60s, `gstsServerSettleIfOpponentAbsent`) triggered settlement for the lone player.
- `PROBE_DUMP_EVT_LEN_SG`: btn_test diagnostic dump; the next three numeric payloads are probeEvt / probeLen / probeSg.

Legacy markers only in logs before 2026-06-10 (removed from code since):

- `PROBE_STAGE_INIT_DONE`: stage initialization reached the probe.
- `PROBE_DESTROY_FIRED`: a destroy/removal event fired.
- `PROBE_LEFT_CHECK`: the next numeric value is the current player count check.
- `PROBE_LEFT_FIRE`: player-left settlement fired.
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
