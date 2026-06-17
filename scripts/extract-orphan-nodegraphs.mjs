#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGilPayloadFields } from '../node_modules/genshin-ts/dist/src/cli/gil_extract_utils.js';
import { loadGiaProto } from '../node_modules/genshin-ts/dist/src/injector/proto.js';
import { findNodeGraphTargets } from '../node_modules/genshin-ts/dist/src/injector/node_graph.js';
import { wrap_gia } from '../node_modules/genshin-ts/dist/src/compiler/gia_vendor.js';
import {
  get_node_name_from_cid,
  get_node_name_from_gid,
  get_node_record,
  get_node_record_generic,
} from '../node_modules/genshin-ts/dist/src/thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/node_data/helpers.js';

const DEFAULT_IDS = [
  1073741826,
  1073741846,
  1073741847,
  1073741848,
  1073741849,
  1073741850,
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    gil: undefined,
    out: 'recovered/orphan-nodegraphs',
    ids: DEFAULT_IDS,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--gil') {
      args.gil = argv[++i];
    } else if (arg === '--out') {
      args.out = argv[++i];
    } else if (arg === '--ids') {
      args.ids = argv[++i]
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id));
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!args.gil) {
    throw new Error('missing required --gil <path>');
  }
  if (args.ids.length === 0) {
    throw new Error('missing node graph ids');
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/extract-orphan-nodegraphs.mjs --gil <map.gil> [--out recovered/orphan-nodegraphs] [--ids 1,2,3] [--dry-run]

This script reads .gil only. It extracts NodeGraph blobs by id into .json, .gia, and .readable.txt files.`);
}

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return undefined;
}

function graphSlug(name, id) {
  const base = String(name || `nodegraph_${id}`).replace(/^_GSTS_/, '');
  const safe = base.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return safe || `nodegraph_${id}`;
}

function pinKindLabel(kind) {
  switch (kind) {
    case 1:
      return 'flow-in';
    case 2:
      return 'flow-out';
    case 3:
      return 'data-in';
    case 4:
      return 'data-out';
    case 5:
      return 'client-exec';
    default:
      return `kind-${kind ?? '?'}`;
  }
}

function connectLabel(connect) {
  if (!connect) {
    return '?';
  }
  const kind = pinKindLabel(connect.kind);
  return connect.index === undefined ? kind : `${kind}:${connect.index}`;
}

function formatConnect(connect) {
  return `${connect.id}.${connectLabel(connect.connect)}`;
}

function templateName(node) {
  const cid = asNumber(node.concreteId?.nodeId);
  const gid = asNumber(node.genericId?.nodeId);
  const byConcrete = cid === undefined ? null : get_node_name_from_cid(cid);
  const byGeneric = gid === undefined ? null : get_node_name_from_gid(gid);
  const concreteRecord = cid === undefined ? null : get_node_record(cid);
  const genericRecord = gid === undefined ? null : get_node_record_generic(gid);
  return byConcrete || byGeneric || concreteRecord?.name || genericRecord?.name || 'Unknown';
}

function extractLiteral(value) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (value.bConcreteValue?.value) {
    return extractLiteral(value.bConcreteValue.value);
  }
  if (value.bString && Object.hasOwn(value.bString, 'val')) {
    return value.bString.val;
  }
  if (value.bInt && Object.hasOwn(value.bInt, 'val')) {
    return value.bInt.val;
  }
  if (value.bFloat && Object.hasOwn(value.bFloat, 'val')) {
    return value.bFloat.val;
  }
  if (value.bBool && Object.hasOwn(value.bBool, 'val')) {
    return value.bBool.val;
  }
  if (value.bEnum && Object.hasOwn(value.bEnum, 'val')) {
    return value.bEnum.val;
  }
  if (value.bGuid && Object.hasOwn(value.bGuid, 'val')) {
    return value.bGuid.val;
  }
  if (value.bVector) {
    return value.bVector;
  }
  if (value.bArray?.values) {
    return value.bArray.values.map((item) => extractLiteral(item));
  }
  if (value.bDict?.values) {
    return value.bDict.values.map((item) => extractLiteral(item));
  }

  return undefined;
}

function formatLiteral(value) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function collectPrimitiveLiterals(value, out) {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === 'string') {
    if (value.length > 0) {
      out.strings.add(value);
    }
    return;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    out.numbers.add(value);
    return;
  }
  if (typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectPrimitiveLiterals(item, out);
    }
    return;
  }
  for (const item of Object.values(value)) {
    collectPrimitiveLiterals(item, out);
  }
}

function uniqueSorted(values) {
  return [...values].sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b), 'zh-CN');
  });
}

function collectGraphFacts(graph) {
  const out = { strings: new Set(), numbers: new Set() };
  collectPrimitiveLiterals(graph, out);
  const nodeTemplateIds = new Set();
  for (const node of graph.nodes ?? []) {
    const gid = asNumber(node.genericId?.nodeId);
    const cid = asNumber(node.concreteId?.nodeId);
    if (gid !== undefined) {
      nodeTemplateIds.add(gid);
    }
    if (cid !== undefined) {
      nodeTemplateIds.add(cid);
    }
  }
  const strings = uniqueSorted(out.strings);
  const numbers = uniqueSorted(out.numbers);
  const largeNumbers = numbers.filter((n) => n >= 1_000_000);
  const uiControlIds = largeNumbers.filter((n) => n >= 1_073_742_000 && n <= 1_073_745_000);
  const entityOrPrefabIds = largeNumbers.filter(
    (n) => !nodeTemplateIds.has(n) && (n >= 1_077_900_000 || n >= 1_180_000_000),
  );
  const timers = strings.filter((s) => /计时|倒计时|timer|Timer|charge|CheckChessMovestage/.test(s));
  const signals = strings.filter((s) => /signal|Signal|send|Send|stage|Stage|ExitGame/.test(s));

  return {
    strings,
    numbers,
    largeNumbers,
    uiControlIds,
    entityOrPrefabIds,
    timers,
    signals,
  };
}

function graphValues(graph) {
  const values = graph.graphValues ?? graph.values ?? [];
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  return values.map((value) => {
    const name = value?.name ?? value?.key ?? '(unnamed)';
    const literal = formatLiteral(extractLiteral(value?.value ?? value));
    return literal === undefined ? String(name) : `${name} = ${literal}`;
  });
}

function nodeLines(node) {
  const gid = asNumber(node.genericId?.nodeId);
  const cid = asNumber(node.concreteId?.nodeId);
  const lines = [
    `- Node ${node.nodeIndex}: ${templateName(node)} (generic=${gid ?? 'n/a'}, concrete=${cid ?? 'n/a'})`,
  ];
  const pins = node.pins ?? [];
  const literalPins = [];
  const inputConnects = [];
  const outputFlows = [];

  for (const pin of pins) {
    const kind = pin.i1?.kind;
    const index = pin.i1?.index ?? 0;
    const literal = formatLiteral(extractLiteral(pin.value));
    if (literal !== undefined) {
      literalPins.push(`${pinKindLabel(kind)}[${index}] = ${literal}`);
    }
    if (kind === 3 && pin.connects?.length) {
      inputConnects.push(
        `${pinKindLabel(kind)}[${index}] <- ${pin.connects.map(formatConnect).join(', ')}`,
      );
    }
    if (kind === 2 && pin.connects?.length) {
      outputFlows.push(
        `${pinKindLabel(kind)}[${index}] -> ${pin.connects.map(formatConnect).join(', ')}`,
      );
    }
  }

  lines.push(`  literals: ${literalPins.length ? literalPins.join('; ') : '(none)'}`);
  lines.push(`  input connections: ${inputConnects.length ? inputConnects.join('; ') : '(none)'}`);
  lines.push(`  output control flow: ${outputFlows.length ? outputFlows.join('; ') : '(none)'}`);
  return lines;
}

function controlFlowEdges(graph) {
  const edges = [];
  for (const node of graph.nodes ?? []) {
    for (const pin of node.pins ?? []) {
      if (pin.i1?.kind !== 2 || !pin.connects?.length) {
        continue;
      }
      const fromIndex = pin.i1.index ?? 0;
      for (const connect of pin.connects) {
        edges.push(
          `${node.nodeIndex}.${fromIndex} -> ${connect.id}.${connect.connect?.index ?? 0}`,
        );
      }
    }
  }
  return edges;
}

function makeReadable(graph) {
  const id = asNumber(graph.id?.id);
  const facts = collectGraphFacts(graph);
  const vars = graphValues(graph);
  const lines = [
    `Graph: ${graph.name ?? '(unnamed)'}`,
    `ID: ${id ?? '(unknown)'}`,
    `Node count: ${(graph.nodes ?? []).length}`,
    '',
    'Node graph variables:',
    ...(vars.length ? vars.map((v) => `- ${v}`) : ['- (none in graphValues; see string literals for custom-variable names)']),
    '',
    'Detected custom-variable/string literals:',
    ...(facts.strings.length ? facts.strings.map((s) => `- ${JSON.stringify(s)}`) : ['- (none)']),
    '',
    'Detected UI control IDs:',
    ...(facts.uiControlIds.length ? facts.uiControlIds.map((n) => `- ${n}`) : ['- (none)']),
    '',
    'Detected entity/prefab/config GUID-like IDs:',
    ...(facts.entityOrPrefabIds.length ? facts.entityOrPrefabIds.map((n) => `- ${n}`) : ['- (none)']),
    '',
    'Detected signal names:',
    ...(facts.signals.length ? facts.signals.map((s) => `- ${JSON.stringify(s)}`) : ['- (none)']),
    '',
    'Detected timer names:',
    ...(facts.timers.length ? facts.timers.map((s) => `- ${JSON.stringify(s)}`) : ['- (none)']),
    '',
    'Nodes:',
  ];

  for (const node of graph.nodes ?? []) {
    lines.push(...nodeLines(node));
  }

  lines.push('', 'Control flow edges:');
  const edges = controlFlowEdges(graph);
  lines.push(...(edges.length ? edges.map((edge) => `- ${edge}`) : ['- (none)']));
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildGiaBytes(rootMessage, graph) {
  const id = asNumber(graph.id?.id);
  const name = graph.name ?? `NodeGraph_${id}`;
  const root = {
    graph: {
      id: {
        class: 10000,
        type: 20000,
        id,
      },
      relatedIds: [],
      name,
      which: 101,
      graph: {
        inner: {
          graph,
        },
      },
    },
    accessories: [],
    filePath: `100000001-0-${id}-${name}.gia`,
    gameVersion: '6.3.0',
  };
  return Buffer.from(wrap_gia(rootMessage, root));
}

function ensureRelativeOrAbsolute(input) {
  if (path.isAbsolute(input)) {
    return input;
  }
  return path.resolve(repoRoot, input);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const gilPath = ensureRelativeOrAbsolute(args.gil);
  const outDir = ensureRelativeOrAbsolute(args.out);
  const { payload, fields } = readGilPayloadFields(gilPath);
  const proto = loadGiaProto();
  const extracted = [];

  for (const id of args.ids) {
    const matches = findNodeGraphTargets(payload, fields, proto.nodeGraphMessage, id);
    if (matches.length !== 1) {
      throw new Error(`expected exactly one NodeGraph for id ${id}, found ${matches.length}`);
    }
    const graph = proto.nodeGraphMessage.toObject(matches[0].obj, {
      defaults: false,
      longs: Number,
      enums: Number,
    });
    extracted.push({ id, graph, slug: graphSlug(graph.name, id) });
  }

  if (args.dryRun) {
    console.log(`Read-only dry run: ${gilPath}`);
    for (const item of extracted) {
      console.log(
        `${item.id} ${item.graph.name ?? '(unnamed)'} nodes=${(item.graph.nodes ?? []).length}`,
      );
    }
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const item of extracted) {
    const base = path.join(outDir, `${item.id}_${item.slug}`);
    fs.writeFileSync(`${base}.json`, `${JSON.stringify(item.graph, null, 2)}\n`);
    fs.writeFileSync(`${base}.gia`, buildGiaBytes(proto.rootMessage, item.graph));
    fs.writeFileSync(`${base}.readable.txt`, makeReadable(item.graph), 'utf8');
    console.log(`wrote ${path.relative(repoRoot, base)}.{json,gia,readable.txt}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
