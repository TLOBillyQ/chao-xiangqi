# NodeGraph Mount Audit

Generated: 2026-06-17T07:48:22.192Z
.gil: `C:/Users/Lzx_8/AppData/LocalLow/miHoYo/原神/BeyondLocal/342478178/Beyond_Local_Save_Level/1073741865.gil`
src: `src`

## Overview

| metric | value |
| --- | --- |
| .gil NodeGraphs | 45 |
| Audited rows | 45 |
| src graph ids | 15 |
| source-orphan in .gil | 30 |
| src ids missing in .gil | 0 |
| mounted | 0 |
| likely-unmounted | 14 |
| ambiguous | 31 |
| src scanner | typescript (36 files) |

## Audited Graphs

| id | name | nodes | sourceStatus | mountStatus | confidence | evidence | note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1073741826 | _GSTS_chargePower | 65 | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x3,9.502.501 x1; unknown:11.5.1.1 x1,18.1.1 x1; catalog:27.2.12.1 x6,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741827 | _GSTS_trigger | 468 | in-src | ambiguous | medium | mount:9.502.505.503.504.4 x3,9.502.501 x1; unknown:8.1.6.13.1.1.2 x17,18.1.1 x1; catalog:5.1.6.13.1.1.2 x32,4.1.7.13.1.1.2 x17 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741828 | _GSTS_playerCreated | 59 | in-src | ambiguous | medium | mount:9.502.505.503.504.4 x3,9.502.501 x1; unknown:15.1.4.16.1.1 x2,18.1.1 x1; catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x6 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741833 | _GSTS_moveActChange | 284 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; unknown:8.1.6.13.1.1.2 x17; catalog:5.1.6.13.1.1.2 x32,4.1.7.13.1.1.2 x17 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741834 | _GSTS_ChessCreate | 14 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; unknown:8.1.6.13.1.1.2 x16; catalog:5.1.6.13.1.1.2 x32,4.1.7.13.1.1.2 x16 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741835 | _GSTS_NineCeilWall | 20 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; catalog:5.1.6.13.1.1.2 x7,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741836 | _GSTS_ChargeChangeTick | 231 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741837 | _GSTS_ResetCharge | 19 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741838 | _GSTS_StopCharge | 307 | in-src | ambiguous | medium | mount:9.502.504 x6,9.501 x1; catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741839 | _GSTS_BeginCharge | 47 | in-src | likely-unmounted | medium | catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | only definition/catalog/index/cache references found |
| 1073741841 | _GSTS_ControlUI | 14 | in-src | likely-unmounted | medium | catalog:27.2.12.1 x3,27.1.1 x1 | only definition/catalog/index/cache references found |
| 1073741842 | _GSTS_ChessInitGraph | 560 | in-src | ambiguous | medium | mount:9.501 x1,9.502.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741843 | _GSTS_playerTimers | 422 | in-src | ambiguous | medium | mount:9.502.501 x1,9.502.502.11.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741844 | _GSTS_changeDir | 242 | in-src | ambiguous | medium | mount:9.502.505.503.504.4 x2,9.502.501 x1; catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741846 | _GSTS_readyChange | 10 | source-orphan | likely-unmounted | high | catalog:27.2.12.1 x3,27.1.1 x1 | only definition/catalog/index/cache references found |
| 1073741847 | _GSTS_StagePanel | 167 | source-orphan | likely-unmounted | high | catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 | only definition/catalog/index/cache references found |
| 1073741848 | _GSTS_ExitGame | 5 | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x5,9.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741849 | _GSTS_readyToPlay | 106 | source-orphan | ambiguous | low | mount:9.502.504 x8,9.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741850 | _GSTS_chessDestroy | 223 | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x3,9.502.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741851 | _GSTS_newGetChessNode | 109 | in-src | ambiguous | medium | mount:9.502.505.503.504.4 x3,9.502.501 x1; catalog:27.2.12.1 x3,5.1.6.13.1.1.2 x2 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1073741852 | _GSTS_getCurrentPiece | 356 | in-src | ambiguous | medium | mount:9.502.505.503.504.4 x3,9.502.501 x1; catalog:5.1.6.13.1.1.2 x8,27.2.12.1 x3 | mount-candidate path(s) found; schema is not strong enough for mounted |
| 1082130433 | 开始蓄力 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.45.1.4.1 x1,16.1.3.45.1.4.1 x1; catalog:6.1.3.5.2 x3,4.1.1 x1 | unknown non-catalog reference path(s) found |
| 1082130434 | 停止蓄力 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.45.1.4.1 x2,16.1.3.45.1.4.1 x2; catalog:6.1.3.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130437 | 棋子阵营过滤节点图 | 43 | source-orphan | ambiguous | low | unknown:15.1.4.67.1.501.501.2 x2,20.1.1 x1; catalog:6.1.2.4.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130439 | 获取扫描目标 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.30.1.5.1 x1,16.1.3.30.1.5.1 x1; catalog:6.1.3.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130440 | 选中棋子过滤器 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.67.1.501.501.2 x1,20.1.1 x1; catalog:6.1.2.4.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130441 | 重置蓄力 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.45.1.6.1 x1,16.1.3.45.1.6.1 x1; catalog:6.1.3.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130442 | 基站决策节点 | 2 | source-orphan | ambiguous | low | unknown:8.1.5.79.1.2 x1; catalog:4.1.6.79.1.2 x1,5.1.5.79.1.2 x1 | unknown non-catalog reference path(s) found |
| 1082130443 | 基站状态节点 | 4 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130444 | UI扫描 | 2 | source-orphan | ambiguous | low | unknown:15.1.4.78.1.4.1 x1,16.1.3.78.1.4.1 x1; catalog:6.1.3.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130445 | 棋子阵营过滤节点图（士帅） | 21 | source-orphan | ambiguous | low | unknown:15.1.4.67.1.501.501.2 x2; catalog:6.1.2.4.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130446 | 命中碰撞检测过滤 | 5 | source-orphan | ambiguous | low | unknown:8.1.7.22.6.2 x16; catalog:5.1.7.22.6.2 x32,4.1.8.22.6.2 x16 | unknown non-catalog reference path(s) found |
| 1082130448 | 九宫格墙壁碰撞过滤 | 6 | source-orphan | likely-unmounted | high | catalog:5.1.7.22.6.2 x6,6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130449 | 中线墙壁碰撞过滤 | 4 | source-orphan | likely-unmounted | high | catalog:5.1.7.22.6.2 x1,6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130450 | 棋子方位确认过滤器 | 9 | source-orphan | ambiguous | low | unknown:15.1.4.67.1.501.501.2 x1; catalog:6.1.2.4.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130451 | 方向特效过滤_下标0 | 7 | source-orphan | ambiguous | low | unknown:8.1.7.16.1.8.2 x2; catalog:4.1.8.16.1.8.2 x2,6.1.2.4.5.2 x1 | unknown non-catalog reference path(s) found |
| 1082130452 | 方向特效过滤_下标1 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130453 | 方向特效过滤_下标2 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130454 | 方向特效过滤_下标3 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130455 | 方向特效过滤_下标4 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130456 | 方向特效过滤_下标5 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130457 | 方向特效过滤_下标6 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130458 | 方向特效过滤_下标7 | 9 | source-orphan | likely-unmounted | high | catalog:6.1.2.4.5.2 x1 | only definition/catalog/index/cache references found |
| 1082130459 | isMine | 7 | source-orphan | ambiguous | low | unknown:8.1.7.38.501.504.2 x3; catalog:4.1.8.38.501.504.2 x3,5.1.7.38.501.504.2 x3 | unknown non-catalog reference path(s) found |
| 1082130460 | isEnemy | 8 | source-orphan | ambiguous | low | unknown:8.1.7.38.501.504.2 x1; catalog:4.1.8.38.501.504.2 x1,5.1.7.38.501.504.2 x1 | unknown non-catalog reference path(s) found |

## Source-Orphan Graphs

- 1073741826 _GSTS_chargePower
- 1073741846 _GSTS_readyChange
- 1073741847 _GSTS_StagePanel
- 1073741848 _GSTS_ExitGame
- 1073741849 _GSTS_readyToPlay
- 1073741850 _GSTS_chessDestroy
- 1082130433 开始蓄力
- 1082130434 停止蓄力
- 1082130437 棋子阵营过滤节点图
- 1082130439 获取扫描目标
- 1082130440 选中棋子过滤器
- 1082130441 重置蓄力
- 1082130442 基站决策节点
- 1082130443 基站状态节点
- 1082130444 UI扫描
- 1082130445 棋子阵营过滤节点图（士帅）
- 1082130446 命中碰撞检测过滤
- 1082130448 九宫格墙壁碰撞过滤
- 1082130449 中线墙壁碰撞过滤
- 1082130450 棋子方位确认过滤器
- 1082130451 方向特效过滤_下标0
- 1082130452 方向特效过滤_下标1
- 1082130453 方向特效过滤_下标2
- 1082130454 方向特效过滤_下标3
- 1082130455 方向特效过滤_下标4
- 1082130456 方向特效过滤_下标5
- 1082130457 方向特效过滤_下标6
- 1082130458 方向特效过滤_下标7
- 1082130459 isMine
- 1082130460 isEnemy

## Likely-Unmounted Graphs

- 1073741839 _GSTS_BeginCharge
- 1073741841 _GSTS_ControlUI
- 1073741846 _GSTS_readyChange
- 1073741847 _GSTS_StagePanel
- 1082130443 基站状态节点
- 1082130448 九宫格墙壁碰撞过滤
- 1082130449 中线墙壁碰撞过滤
- 1082130452 方向特效过滤_下标1
- 1082130453 方向特效过滤_下标2
- 1082130454 方向特效过滤_下标3
- 1082130455 方向特效过滤_下标4
- 1082130456 方向特效过滤_下标5
- 1082130457 方向特效过滤_下标6
- 1082130458 方向特效过滤_下标7

## Ambiguous Graphs

- 1073741826 _GSTS_chargePower
- 1073741827 _GSTS_trigger
- 1073741828 _GSTS_playerCreated
- 1073741833 _GSTS_moveActChange
- 1073741834 _GSTS_ChessCreate
- 1073741835 _GSTS_NineCeilWall
- 1073741836 _GSTS_ChargeChangeTick
- 1073741837 _GSTS_ResetCharge
- 1073741838 _GSTS_StopCharge
- 1073741842 _GSTS_ChessInitGraph
- 1073741843 _GSTS_playerTimers
- 1073741844 _GSTS_changeDir
- 1073741848 _GSTS_ExitGame
- 1073741849 _GSTS_readyToPlay
- 1073741850 _GSTS_chessDestroy
- 1073741851 _GSTS_newGetChessNode
- 1073741852 _GSTS_getCurrentPiece
- 1082130433 开始蓄力
- 1082130434 停止蓄力
- 1082130437 棋子阵营过滤节点图
- 1082130439 获取扫描目标
- 1082130440 选中棋子过滤器
- 1082130441 重置蓄力
- 1082130442 基站决策节点
- 1082130444 UI扫描
- 1082130445 棋子阵营过滤节点图（士帅）
- 1082130446 命中碰撞检测过滤
- 1082130450 棋子方位确认过滤器
- 1082130451 方向特效过滤_下标0
- 1082130459 isMine
- 1082130460 isEnemy

## Focus Historical IDs

| id | name | sourceStatus | mountStatus | confidence | evidence |
| --- | --- | --- | --- | --- | --- |
| 1073741826 | _GSTS_chargePower | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x3,9.502.501 x1; unknown:11.5.1.1 x1,18.1.1 x1; catalog:27.2.12.1 x6,27.1.1 x1 |
| 1073741846 | _GSTS_readyChange | source-orphan | likely-unmounted | high | catalog:27.2.12.1 x3,27.1.1 x1 |
| 1073741847 | _GSTS_StagePanel | source-orphan | likely-unmounted | high | catalog:5.1.6.13.1.1.2 x10,27.2.12.1 x3 |
| 1073741848 | _GSTS_ExitGame | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x5,9.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 |
| 1073741849 | _GSTS_readyToPlay | source-orphan | ambiguous | low | mount:9.502.504 x8,9.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 |
| 1073741850 | _GSTS_chessDestroy | source-orphan | ambiguous | low | mount:9.502.505.503.504.4 x3,9.502.501 x1; catalog:27.2.12.1 x3,27.1.1 x1 |

## Active TS Graph Mount Evidence

| id | name | mountStatus | confidence | mount-candidate paths | unknown paths |
| --- | --- | --- | --- | --- | --- |
| 1073741827 | _GSTS_trigger | ambiguous | medium | 9.502.505.503.504.4 x3<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1 | 8.1.6.13.1.1.2 x17<br>18.1.1 x1 |
| 1073741828 | _GSTS_playerCreated | ambiguous | medium | 9.502.505.503.504.4 x3<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1 | 15.1.4.16.1.1 x2<br>18.1.1 x1 |
| 1073741833 | _GSTS_moveActChange | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | 8.1.6.13.1.1.2 x17 |
| 1073741834 | _GSTS_ChessCreate | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | 8.1.6.13.1.1.2 x16 |
| 1073741835 | _GSTS_NineCeilWall | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741836 | _GSTS_ChargeChangeTick | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741837 | _GSTS_ResetCharge | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741838 | _GSTS_StopCharge | ambiguous | medium | 9.502.504 x6<br>9.501 x1<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741839 | _GSTS_BeginCharge | likely-unmounted | medium | (none) | (none) |
| 1073741841 | _GSTS_ControlUI | likely-unmounted | medium | (none) | (none) |
| 1073741842 | _GSTS_ChessInitGraph | ambiguous | medium | 9.501 x1<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.504 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741843 | _GSTS_playerTimers | ambiguous | medium | 9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1<br>9.502.505.503.504.4 x1 | (none) |
| 1073741844 | _GSTS_changeDir | ambiguous | medium | 9.502.505.503.504.4 x2<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1 | (none) |
| 1073741851 | _GSTS_newGetChessNode | ambiguous | medium | 9.502.505.503.504.4 x3<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1 | (none) |
| 1073741852 | _GSTS_getCurrentPiece | ambiguous | medium | 9.502.505.503.504.4 x3<br>9.502.501 x1<br>9.502.502.11.501 x1<br>9.502.503 x1 | (none) |

## Protobuf Path Signature Appendix

| classification | path | graphs | activeGraphs | sourceOrphanGraphs | refs |
| --- | --- | --- | --- | --- | --- |
| catalog/index/cache | 6.1.2.4.5.2 | 41 | 15 | 26 | 41 |
| catalog/index/cache | 27.2.12.1 | 21 | 15 | 6 | 78 |
| catalog/index/cache | 27.1.1 | 21 | 15 | 6 | 21 |
| catalog/index/cache | 4.1.6.50.501 | 20 | 14 | 6 | 20 |
| catalog/index/cache | 5.1.6.13.1.1.2 | 18 | 15 | 3 | 188 |
| mount-candidate | 9.502.505.503.504.4 | 17 | 13 | 4 | 34 |
| mount-candidate | 9.502.501 | 17 | 13 | 4 | 17 |
| mount-candidate | 9.502.502.11.501 | 17 | 13 | 4 | 17 |
| mount-candidate | 9.502.503 | 13 | 11 | 2 | 13 |
| catalog/index/cache | 4.1.7.13.1.1.2 | 11 | 10 | 1 | 65 |
| catalog/index/cache | 6.1.3.5.2 | 6 | 0 | 6 | 8 |
| unknown | 20.1.1 | 5 | 0 | 5 | 5 |
| unknown | 15.1.4.67.1.501.501.2 | 4 | 0 | 4 | 6 |
| mount-candidate | 9.501 | 4 | 2 | 2 | 4 |
| unknown | 8.1.6.13.1.1.2 | 3 | 3 | 0 | 50 |
| catalog/index/cache | 5.1.7.22.6.2 | 3 | 0 | 3 | 39 |
| mount-candidate | 9.502.504 | 3 | 2 | 1 | 15 |
| unknown | 18.1.1 | 3 | 2 | 1 | 3 |
| catalog/index/cache | 4.1.8.38.501.504.2 | 2 | 0 | 2 | 4 |
| catalog/index/cache | 5.1.7.38.501.504.2 | 2 | 0 | 2 | 4 |
| unknown | 8.1.7.38.501.504.2 | 2 | 0 | 2 | 4 |
| unknown | 15.1.4.45.1.4.1 | 2 | 0 | 2 | 3 |
| unknown | 16.1.3.45.1.4.1 | 2 | 0 | 2 | 3 |
| catalog/index/cache | 5.1.7.23.4.502 | 2 | 1 | 1 | 2 |
| mount-candidate | 9.502.502.13.501 | 2 | 0 | 2 | 2 |
| catalog/index/cache | 4.1.8.22.6.2 | 1 | 0 | 1 | 16 |
| unknown | 8.1.7.22.6.2 | 1 | 0 | 1 | 16 |
| unknown | 15.1.4.16.1.1 | 1 | 1 | 0 | 2 |
| catalog/index/cache | 4.1.8.16.1.8.2 | 1 | 0 | 1 | 2 |
| unknown | 8.1.7.16.1.8.2 | 1 | 0 | 1 | 2 |
| unknown | 11.5.1.1 | 1 | 0 | 1 | 1 |
| unknown | 15.1.4.30.1.5.1 | 1 | 0 | 1 | 1 |
| unknown | 15.1.4.45.1.6.1 | 1 | 0 | 1 | 1 |
| unknown | 15.1.4.78.1.4.1 | 1 | 0 | 1 | 1 |
| unknown | 16.1.3.30.1.5.1 | 1 | 0 | 1 | 1 |
| unknown | 16.1.3.45.1.6.1 | 1 | 0 | 1 | 1 |
| unknown | 16.1.3.78.1.4.1 | 1 | 0 | 1 | 1 |
| unknown | 30.1.1 | 1 | 0 | 1 | 1 |
| unknown | 33.1.1 | 1 | 0 | 1 | 1 |
| catalog/index/cache | 4.1.1 | 1 | 0 | 1 | 1 |
| catalog/index/cache | 4.1.6.50.501.64 | 1 | 1 | 0 | 1 |
| catalog/index/cache | 4.1.6.79.1.2 | 1 | 0 | 1 | 1 |
| catalog/index/cache | 5.1.2.1 | 1 | 0 | 1 | 1 |
| catalog/index/cache | 5.1.5.79.1.2 | 1 | 0 | 1 | 1 |
| unknown | 7.1.1 | 1 | 0 | 1 | 1 |
| unknown | 8.1.1 | 1 | 0 | 1 | 1 |
| unknown | 8.1.2.1 | 1 | 0 | 1 | 1 |
| unknown | 8.1.5.79.1.2 | 1 | 0 | 1 | 1 |
| mount-candidate | 9.502.502.503.504.4 | 1 | 0 | 1 | 1 |

## Limitations

- This is a read-only audit. It does not modify `.gil`, `src/`, or `gsts.config.ts`.
- `source-orphan` only means no matching `g.server({ id })` was found under the selected src root.
- `likely-unmounted` is used only when references are limited to definition/catalog/index/cache paths.
- `9.*` and unknown paths are reported as `ambiguous` until the `.gil` schema is confirmed.
- Numeric ID spaces can overlap with editor object/control IDs, so raw varint hits are low-confidence evidence.

