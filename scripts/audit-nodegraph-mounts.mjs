#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGilPayloadFields } from '../node_modules/genshin-ts/dist/src/cli/gil_extract_utils.js';
import { encodeVarint, readVarint } from '../node_modules/genshin-ts/dist/src/injector/binary.js';
import { loadGiaProto } from '../node_modules/genshin-ts/dist/src/injector/proto.js';

const SCHEMA_VERSION = 1;
const DEFAULT_FORMAT = 'table';
const DEFAULT_SRC = 'src';
const DEFAULT_PATH_SAMPLES = 5;
const MAX_PROTO_DEPTH = 10;
const FORMATS = new Set(['table', 'json', 'md']);
const CATALOG_TOP_LEVEL_FIELDS = new Set([4, 5, 6, 27]);
const MOUNT_CANDIDATE_TOP_LEVEL_FIELDS = new Set([9]);
const FOCUS_IDS = new Set([
  1073741826,
  1073741846,
  1073741847,
  1073741848,
  1073741849,
  1073741850,
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function printHelp() {
  console.log(`Usage:
  node scripts/audit-nodegraph-mounts.mjs --gil <map.gil> [--src src]

Options:
  --ids 1073741826,1073741846     Audit only selected NodeGraph ids in table/json/md output
  --out recovered/nodegraph-mount-audit
                                   Write nodegraph-mount-audit.json and .md
  --format table|json|md           Stdout format (default: table)
  --include-path-samples 8         Sample offsets per protobuf path (default: 5)
  --strict                         Exit non-zero when any audited graph is ambiguous
  --help                           Show this help

This tool reads .gil and src only. It does not modify maps or source files.`);
}

function readOption(argv, index) {
  const arg = argv[index];
  const eq = arg.indexOf('=');
  if (eq !== -1) {
    return { value: arg.slice(eq + 1), nextIndex: index };
  }
  if (index + 1 >= argv.length) {
    throw new Error(`missing value for ${arg}`);
  }
  return { value: argv[index + 1], nextIndex: index + 1 };
}

function parseArgs(argv) {
  const args = {
    gil: undefined,
    src: DEFAULT_SRC,
    ids: undefined,
    out: undefined,
    format: DEFAULT_FORMAT,
    includePathSamples: DEFAULT_PATH_SAMPLES,
    strict: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const name = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;

    if (name === '--help' || name === '-h') {
      printHelp();
      process.exit(0);
    }
    if (name === '--strict') {
      args.strict = true;
      continue;
    }
    if (name === '--gil') {
      const parsed = readOption(argv, i);
      args.gil = parsed.value;
      i = parsed.nextIndex;
      continue;
    }
    if (name === '--src') {
      const parsed = readOption(argv, i);
      args.src = parsed.value;
      i = parsed.nextIndex;
      continue;
    }
    if (name === '--ids') {
      const parsed = readOption(argv, i);
      args.ids = parsed.value
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isSafeInteger(value));
      i = parsed.nextIndex;
      continue;
    }
    if (name === '--out') {
      const parsed = readOption(argv, i);
      args.out = parsed.value;
      i = parsed.nextIndex;
      continue;
    }
    if (name === '--format') {
      const parsed = readOption(argv, i);
      args.format = parsed.value;
      i = parsed.nextIndex;
      continue;
    }
    if (name === '--include-path-samples') {
      const parsed = readOption(argv, i);
      args.includePathSamples = Number(parsed.value);
      i = parsed.nextIndex;
      continue;
    }

    throw new Error(`unknown argument: ${raw}`);
  }

  if (!args.gil) {
    throw new Error('missing required --gil <path>');
  }
  if (!FORMATS.has(args.format)) {
    throw new Error(`invalid --format ${args.format}; expected table, json, or md`);
  }
  if (!Number.isInteger(args.includePathSamples) || args.includePathSamples < 0) {
    throw new Error('--include-path-samples must be a non-negative integer');
  }
  if (args.ids && args.ids.length === 0) {
    throw new Error('--ids did not contain any valid numeric ids');
  }

  return args;
}

function resolveInputPath(input) {
  if (path.isAbsolute(input)) {
    return path.normalize(input);
  }
  return path.resolve(repoRoot, input);
}

function displayPath(absPath) {
  const rel = path.relative(repoRoot, absPath);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
    return normalizePath(rel);
  }
  return normalizePath(absPath);
}

function normalizePath(value) {
  return String(value).replace(/\\/g, '/');
}

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    const numberValue = value.toNumber();
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
  return undefined;
}

function fieldPath(field) {
  return [field.p0, field.p1, field.p2, field.p3, field.p4, field.p5]
    .slice(0, field.depth)
    .join('.');
}

function parentPath(pathValue) {
  const parts = pathValue.split('.');
  parts.pop();
  return parts.join('.');
}

function topLevelField(pathValue) {
  const first = pathValue.split('.')[0];
  const value = Number(first);
  return Number.isInteger(value) ? value : undefined;
}

function isNodeGraphDefinitionField(field) {
  return field.depth === 3 && field.p0 === 10 && field.p1 === 1 && field.p2 === 1;
}

function readGilGraphs(gilPath) {
  const { payload, fields } = readGilPayloadFields(gilPath);
  const proto = loadGiaProto();
  const graphs = [];
  const warnings = [];

  for (const field of fields) {
    if (!isNodeGraphDefinitionField(field)) {
      continue;
    }

    const slice = payload.subarray(field.dataStart, field.dataEnd);
    try {
      const decoded = proto.nodeGraphMessage.decode(slice);
      const graph = proto.nodeGraphMessage.toObject(decoded, {
        defaults: false,
        longs: Number,
        enums: Number,
      });
      const id = asNumber(graph.id?.id);
      if (!Number.isSafeInteger(id)) {
        warnings.push(`skipped NodeGraph at ${fieldPath(field)} offset ${field.dataStart}: missing numeric id`);
        continue;
      }
      graphs.push({
        id,
        name: graph.name ?? '',
        graphType: asNumber(graph.id?.type),
        nodeCount: Array.isArray(graph.nodes) ? graph.nodes.length : 0,
        definitionPath: fieldPath(field),
        definitionRange: {
          start: field.dataStart,
          end: field.dataEnd,
        },
      });
    } catch (error) {
      warnings.push(
        `failed to decode NodeGraph at ${fieldPath(field)} offset ${field.dataStart}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  graphs.sort((a, b) => a.id - b.id);
  return { payload, fields, graphs, warnings };
}

function listTypeScriptFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }
  const files = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function unwrapTsExpression(ts, expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    (ts.isSatisfiesExpression && ts.isSatisfiesExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function propertyNameText(ts, name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function evalNumericExpression(ts, expression, constants) {
  const current = unwrapTsExpression(ts, expression);

  if (ts.isNumericLiteral(current)) {
    return Number(current.text);
  }
  if (ts.isBigIntLiteral?.(current)) {
    return Number(current.text.replace(/n$/, ''));
  }
  if (ts.isPrefixUnaryExpression(current)) {
    const value = evalNumericExpression(ts, current.operand, constants);
    if (value === undefined) {
      return undefined;
    }
    if (current.operator === ts.SyntaxKind.MinusToken) {
      return -value;
    }
    if (current.operator === ts.SyntaxKind.PlusToken) {
      return value;
    }
    return undefined;
  }
  if (ts.isIdentifier(current)) {
    return constants.get(current.text);
  }
  if (ts.isPropertyAccessExpression(current)) {
    const key = `${current.expression.getText()}.${current.name.text}`;
    return constants.get(key);
  }
  if (ts.isElementAccessExpression(current) && ts.isIdentifier(current.expression)) {
    const argument = unwrapTsExpression(ts, current.argumentExpression);
    if (argument && ts.isStringLiteral(argument)) {
      return constants.get(`${current.expression.text}.${argument.text}`);
    }
  }

  return undefined;
}

function collectNumericConstants(ts, sourceFile, constants) {
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const variableName = node.name.text;
      const initializer = unwrapTsExpression(ts, node.initializer);
      const directValue = evalNumericExpression(ts, initializer, constants);
      if (Number.isSafeInteger(directValue)) {
        constants.set(variableName, directValue);
      }
      if (ts.isObjectLiteralExpression(initializer)) {
        for (const property of initializer.properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }
          const key = propertyNameText(ts, property.name);
          if (!key) {
            continue;
          }
          const value = evalNumericExpression(ts, property.initializer, constants);
          if (Number.isSafeInteger(value)) {
            constants.set(`${variableName}.${key}`, value);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function isGServerCall(ts, node) {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const expression = node.expression;
  return ts.isPropertyAccessExpression(expression) && expression.name.text === 'server';
}

function findObjectProperty(ts, objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const key = propertyNameText(ts, property.name);
    if (key === propertyName) {
      return property.initializer;
    }
  }
  return undefined;
}

function scanSourceIdsWithTypeScript(ts, files) {
  const constants = new Map();
  const sourceFiles = [];
  const byId = new Map();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    sourceFiles.push(sourceFile);
    collectNumericConstants(ts, sourceFile, constants);
  }

  for (const sourceFile of sourceFiles) {
    function visit(node) {
      if (isGServerCall(ts, node)) {
        const firstArg = node.arguments[0];
        if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
          const idExpression = findObjectProperty(ts, firstArg, 'id');
          const id = idExpression ? evalNumericExpression(ts, idExpression, constants) : undefined;
          if (Number.isSafeInteger(id)) {
            const lineChar = sourceFile.getLineAndCharacterOfPosition(idExpression.getStart(sourceFile));
            const item = {
              file: displayPath(sourceFile.fileName),
              line: lineChar.line + 1,
              column: lineChar.character + 1,
            };
            if (!byId.has(id)) {
              byId.set(id, []);
            }
            byId.get(id).push(item);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return byId;
}

function scanSourceIdsWithRegex(files) {
  const byId = new Map();
  const regex = /g\s*\.\s*server\s*\(\s*\{[\s\S]{0,600}?\bid\s*:\s*(\d+)/g;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(text))) {
      const id = Number(match[1]);
      if (!Number.isSafeInteger(id)) {
        continue;
      }
      const prefix = text.slice(0, match.index + match[0].lastIndexOf(match[1]));
      const lines = prefix.split(/\r?\n/);
      const item = {
        file: displayPath(file),
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      };
      if (!byId.has(id)) {
        byId.set(id, []);
      }
      byId.get(id).push(item);
    }
  }

  return byId;
}

async function scanSourceIds(srcRoot) {
  const absSrcRoot = resolveInputPath(srcRoot);
  const files = listTypeScriptFiles(absSrcRoot);
  const warnings = [];

  if (!fs.existsSync(absSrcRoot)) {
    warnings.push(`src root does not exist: ${displayPath(absSrcRoot)}`);
    return {
      srcRoot: displayPath(absSrcRoot),
      ids: new Set(),
      byId: new Map(),
      warnings,
      scanner: 'none',
      fileCount: 0,
    };
  }

  try {
    const imported = await import('typescript');
    const ts = imported.default ?? imported;
    const byId = scanSourceIdsWithTypeScript(ts, files);
    return {
      srcRoot: displayPath(absSrcRoot),
      ids: new Set(byId.keys()),
      byId,
      warnings,
      scanner: 'typescript',
      fileCount: files.length,
    };
  } catch (error) {
    warnings.push(
      `TypeScript parser unavailable; used regex fallback: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    const byId = scanSourceIdsWithRegex(files);
    return {
      srcRoot: displayPath(absSrcRoot),
      ids: new Set(byId.keys()),
      byId,
      warnings,
      scanner: 'regex',
      fileCount: files.length,
    };
  }
}

function buildDefinitionRangeChecker(graphs) {
  const ranges = graphs
    .map((graph) => graph.definitionRange)
    .sort((a, b) => a.start - b.start);

  return function isInDefinitionRange(offset) {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const range = ranges[mid];
      if (offset < range.start) {
        high = mid - 1;
      } else if (offset >= range.end) {
        low = mid + 1;
      } else {
        return true;
      }
    }
    return false;
  };
}

function isDefinitionLikePath(pathValue) {
  return pathValue === '10.1.1' || pathValue.startsWith('10.1.1.');
}

function classifyPath(pathValue) {
  if (!pathValue || pathValue === '(root)') {
    return 'unknown';
  }
  if (isDefinitionLikePath(pathValue)) {
    return 'definition';
  }
  const top = topLevelField(pathValue);
  if (CATALOG_TOP_LEVEL_FIELDS.has(top)) {
    return 'catalog/index/cache';
  }
  if (MOUNT_CANDIDATE_TOP_LEVEL_FIELDS.has(top)) {
    return 'mount-candidate';
  }
  return 'unknown';
}

function pathForOffset(fields, offset) {
  let best;
  let bestSize = Number.POSITIVE_INFINITY;

  for (const field of fields) {
    if (field.dataStart <= offset && offset < field.dataEnd) {
      const size = field.dataEnd - field.dataStart;
      if (size < bestSize) {
        best = field;
        bestSize = size;
      }
    }
  }

  return best ? fieldPath(best) : '(root)';
}

function addReference(refsById, seenById, reference) {
  if (!refsById.has(reference.id)) {
    return;
  }
  const key = `${reference.offset}:${reference.path}:${reference.matchKind}`;
  const seen = seenById.get(reference.id);
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  refsById.get(reference.id).push(reference);
}

function parseReferences(payload, targetIds, isInDefinitionRange, refsById, seenById) {
  function parseRange(start, end, pathPrefix, depth) {
    let offset = start;
    while (offset < end) {
      const keyStart = offset;
      const key = readVarint(payload, offset);
      if (!key) {
        return;
      }
      offset = key.next;

      const field = key.value >> 3;
      const wire = key.value & 7;
      const nextPath = pathPrefix ? `${pathPrefix}.${field}` : String(field);

      if (wire === 0) {
        const dataStart = offset;
        const value = readVarint(payload, offset);
        if (!value) {
          return;
        }
        offset = value.next;
        if (targetIds.has(value.value) && !isInDefinitionRange(dataStart)) {
          addReference(refsById, seenById, {
            id: value.value,
            path: nextPath,
            parentPath: parentPath(nextPath),
            offset: dataStart,
            keyOffset: keyStart,
            classification: classifyPath(nextPath),
            matchKind: 'varint-field',
          });
        }
        continue;
      }

      if (wire === 1) {
        offset += 8;
        continue;
      }

      if (wire === 2) {
        const len = readVarint(payload, offset);
        if (!len) {
          return;
        }
        const dataStart = len.next;
        const dataEnd = dataStart + len.value;
        if (dataEnd > end || dataEnd < dataStart) {
          return;
        }
        if (
          len.value > 0 &&
          depth < MAX_PROTO_DEPTH &&
          !isDefinitionLikePath(nextPath) &&
          !isInDefinitionRange(dataStart)
        ) {
          parseRange(dataStart, dataEnd, nextPath, depth + 1);
        }
        offset = dataEnd;
        continue;
      }

      if (wire === 5) {
        offset += 4;
        continue;
      }

      return;
    }
  }

  parseRange(0, payload.length, '', 0);
}

function findRawVarintReferences(payload, fields, graphs, refsById, seenById, isInDefinitionRange) {
  const buffer = Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);

  for (const graph of graphs) {
    const needle = Buffer.from(encodeVarint(graph.id));
    let offset = buffer.indexOf(needle, 0);
    const exactOffsets = new Set(refsById.get(graph.id).map((reference) => reference.offset));

    while (offset !== -1) {
      if (!isInDefinitionRange(offset) && !exactOffsets.has(offset)) {
        const pathValue = pathForOffset(fields, offset);
        addReference(refsById, seenById, {
          id: graph.id,
          path: pathValue,
          parentPath: parentPath(pathValue),
          offset,
          keyOffset: undefined,
          classification: classifyPath(pathValue),
          matchKind: 'raw-varint',
        });
      }
      offset = buffer.indexOf(needle, offset + 1);
    }
  }
}

function collectGraphReferences(payload, fields, graphs) {
  const targetIds = new Set(graphs.map((graph) => graph.id));
  const refsById = new Map(graphs.map((graph) => [graph.id, []]));
  const seenById = new Map(graphs.map((graph) => [graph.id, new Set()]));
  const isInDefinitionRange = buildDefinitionRangeChecker(graphs);

  parseReferences(payload, targetIds, isInDefinitionRange, refsById, seenById);
  findRawVarintReferences(payload, fields, graphs, refsById, seenById, isInDefinitionRange);

  for (const refs of refsById.values()) {
    refs.sort((a, b) => a.offset - b.offset || a.path.localeCompare(b.path));
  }

  return refsById;
}

function makePathSummaries(references, includePathSamples, classificationFilter) {
  const groups = new Map();

  for (const reference of references) {
    if (classificationFilter && reference.classification !== classificationFilter) {
      continue;
    }
    const key = `${reference.classification}:${reference.path}`;
    if (!groups.has(key)) {
      groups.set(key, {
        path: reference.path,
        parentPath: reference.parentPath,
        classification: reference.classification,
        count: 0,
        sampleOffsets: [],
        matchKinds: new Set(),
      });
    }
    const group = groups.get(key);
    group.count += 1;
    group.matchKinds.add(reference.matchKind);
    if (group.sampleOffsets.length < includePathSamples) {
      group.sampleOffsets.push(reference.offset);
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .map((group) => ({
      path: group.path,
      parentPath: group.parentPath,
      classification: group.classification,
      count: group.count,
      sampleOffsets: group.sampleOffsets,
      matchKinds: [...group.matchKinds].sort(),
    }));
}

function isStrongMountEvidence(_reference) {
  // The public .gil schema is incomplete. Keep this intentionally empty until a
  // path is validated as an entity/component/owner mount record.
  return false;
}

function determineMountStatus(graph, references, sourceStatus) {
  const nonDefinitionRefs = references.filter((reference) => reference.classification !== 'definition');
  const strongMountRefs = nonDefinitionRefs.filter(isStrongMountEvidence);
  const mountCandidateRefs = nonDefinitionRefs.filter(
    (reference) => reference.classification === 'mount-candidate',
  );
  const unknownRefs = nonDefinitionRefs.filter((reference) => reference.classification === 'unknown');

  if (strongMountRefs.length > 0) {
    return {
      mountStatus: 'mounted',
      confidence: 'high',
      note: 'strong entity/component mount evidence found outside definition/catalog paths',
    };
  }

  if (mountCandidateRefs.length > 0 || unknownRefs.length > 0) {
    const confidence = sourceStatus === 'in-src' && mountCandidateRefs.length > 0 ? 'medium' : 'low';
    return {
      mountStatus: 'ambiguous',
      confidence,
      note:
        mountCandidateRefs.length > 0
          ? 'mount-candidate path(s) found; schema is not strong enough for mounted'
          : 'unknown non-catalog reference path(s) found',
    };
  }

  return {
    mountStatus: 'likely-unmounted',
    confidence: sourceStatus === 'source-orphan' ? 'high' : 'medium',
    note:
      nonDefinitionRefs.length > 0
        ? 'only definition/catalog/index/cache references found'
        : 'only NodeGraph definition found',
  };
}

function graphLabel(graph) {
  return `${graph.id}${graph.name ? ` ${graph.name}` : ''}`;
}

function buildPathSignatureAppendix(graphAudits, srcIds) {
  const byPath = new Map();

  for (const graph of graphAudits) {
    for (const reference of graph.references) {
      const key = `${reference.classification}:${reference.path}`;
      if (!byPath.has(key)) {
        byPath.set(key, {
          path: reference.path,
          classification: reference.classification,
          graphCount: 0,
          totalRefCount: 0,
          activeGraphCount: 0,
          sourceOrphanGraphCount: 0,
          graphIds: [],
        });
      }
      const item = byPath.get(key);
      item.graphCount += 1;
      item.totalRefCount += reference.count;
      item.graphIds.push(graph.id);
      if (srcIds.has(graph.id)) {
        item.activeGraphCount += 1;
      } else {
        item.sourceOrphanGraphCount += 1;
      }
    }
  }

  return [...byPath.values()].sort(
    (a, b) =>
      b.graphCount - a.graphCount ||
      b.totalRefCount - a.totalRefCount ||
      a.path.localeCompare(b.path),
  );
}

function buildAudit(args, gilData, srcScan, refsById) {
  const allGilGraphIds = new Set(gilData.graphs.map((graph) => graph.id));
  const requestedIds = args.ids ? new Set(args.ids) : undefined;
  const selectedGraphs = requestedIds
    ? gilData.graphs.filter((graph) => requestedIds.has(graph.id))
    : gilData.graphs;
  const missingRequestedIds = requestedIds
    ? [...requestedIds].filter((id) => !allGilGraphIds.has(id)).sort((a, b) => a - b)
    : [];

  const graphAudits = selectedGraphs.map((graph) => {
    const sourceStatus = srcScan.ids.has(graph.id) ? 'in-src' : 'source-orphan';
    const rawReferences = refsById.get(graph.id) ?? [];
    const references = makePathSummaries(rawReferences, args.includePathSamples);
    const catalogEvidence = makePathSummaries(
      rawReferences,
      args.includePathSamples,
      'catalog/index/cache',
    );
    const mountEvidence = makePathSummaries(
      rawReferences,
      args.includePathSamples,
      'mount-candidate',
    );
    const unknownEvidence = makePathSummaries(rawReferences, args.includePathSamples, 'unknown');
    const status = determineMountStatus(graph, rawReferences, sourceStatus);
    const warnings = [];
    if (rawReferences.some((reference) => reference.matchKind === 'raw-varint')) {
      warnings.push('raw varint byte hit(s) found outside parsed varint fields; treat as low-confidence');
    }
    if (FOCUS_IDS.has(graph.id)) {
      warnings.push('focus historical _GSTS_* audit id');
    }

    return {
      id: graph.id,
      name: graph.name,
      graphType: graph.graphType,
      nodeCount: graph.nodeCount,
      sourceStatus,
      mountStatus: status.mountStatus,
      confidence: status.confidence,
      definitionPath: graph.definitionPath,
      definitionRange: graph.definitionRange,
      references,
      catalogEvidence,
      mountEvidence,
      unknownEvidence,
      warnings,
      note: status.note,
      sourceLocations: srcScan.byId.get(graph.id) ?? [],
      focus: FOCUS_IDS.has(graph.id),
    };
  });

  const sourceOrphans = gilData.graphs
    .filter((graph) => !srcScan.ids.has(graph.id))
    .map((graph) => ({ id: graph.id, name: graph.name }))
    .sort((a, b) => a.id - b.id);
  const srcMissingInGil = [...srcScan.ids]
    .filter((id) => !allGilGraphIds.has(id))
    .sort((a, b) => a - b)
    .map((id) => ({ id, sourceLocations: srcScan.byId.get(id) ?? [] }));
  const selectedLikelyUnmounted = graphAudits
    .filter((graph) => graph.mountStatus === 'likely-unmounted')
    .map((graph) => ({ id: graph.id, name: graph.name }));
  const selectedAmbiguous = graphAudits
    .filter((graph) => graph.mountStatus === 'ambiguous')
    .map((graph) => ({ id: graph.id, name: graph.name }));
  const selectedMounted = graphAudits
    .filter((graph) => graph.mountStatus === 'mounted')
    .map((graph) => ({ id: graph.id, name: graph.name }));

  const warnings = [...gilData.warnings, ...srcScan.warnings];
  if (missingRequestedIds.length > 0) {
    warnings.push(`requested id(s) not found in .gil: ${missingRequestedIds.join(', ')}`);
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    gilPath: displayPath(resolveInputPath(args.gil)),
    srcRoot: srcScan.srcRoot,
    generatedAt: new Date().toISOString(),
    options: {
      ids: args.ids ?? null,
      format: args.format,
      includePathSamples: args.includePathSamples,
      strict: args.strict,
    },
    summary: {
      gilGraphCount: gilData.graphs.length,
      selectedGraphCount: graphAudits.length,
      srcGraphCount: srcScan.ids.size,
      srcScanner: srcScan.scanner,
      srcFileCount: srcScan.fileCount,
      sourceOrphanCount: sourceOrphans.length,
      srcMissingInGilCount: srcMissingInGil.length,
      mountedCount: selectedMounted.length,
      likelyUnmountedCount: selectedLikelyUnmounted.length,
      ambiguousCount: selectedAmbiguous.length,
      focusIdsPresent: [...FOCUS_IDS].filter((id) => allGilGraphIds.has(id)).sort((a, b) => a - b),
      missingRequestedIds,
    },
    sourceOrphans,
    srcMissingInGil,
    likelyUnmounted: selectedLikelyUnmounted,
    ambiguous: selectedAmbiguous,
    mounted: selectedMounted,
    pathSignatures: buildPathSignatureAppendix(graphAudits, srcScan.ids),
    warnings,
    graphs: graphAudits,
  };
}

function compactEvidence(graph) {
  const pieces = [];
  if (graph.mountEvidence.length > 0) {
    pieces.push(
      `mount:${graph.mountEvidence
        .slice(0, 2)
        .map((item) => `${item.path} x${item.count}`)
        .join(',')}`,
    );
  }
  if (graph.unknownEvidence.length > 0) {
    pieces.push(
      `unknown:${graph.unknownEvidence
        .slice(0, 2)
        .map((item) => `${item.path} x${item.count}`)
        .join(',')}`,
    );
  }
  if (graph.catalogEvidence.length > 0) {
    pieces.push(
      `catalog:${graph.catalogEvidence
        .slice(0, 2)
        .map((item) => `${item.path} x${item.count}`)
        .join(',')}`,
    );
  }
  return pieces.join('; ') || graph.definitionPath;
}

function truncate(value, width) {
  const text = String(value ?? '');
  if (text.length <= width) {
    return text;
  }
  if (width <= 3) {
    return text.slice(0, width);
  }
  return `${text.slice(0, width - 3)}...`;
}

function pad(value, width) {
  const text = String(value ?? '');
  return text + ' '.repeat(Math.max(0, width - text.length));
}

function renderSimpleTable(rows, columns) {
  const widths = columns.map((column) => {
    const contentWidth = Math.max(
      column.header.length,
      ...rows.map((row) => truncate(row[column.key], column.maxWidth).length),
    );
    return Math.min(column.maxWidth, contentWidth);
  });

  const header = columns
    .map((column, index) => pad(truncate(column.header, widths[index]), widths[index]))
    .join('  ');
  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  const body = rows.map((row) =>
    columns
      .map((column, index) => pad(truncate(row[column.key], widths[index]), widths[index]))
      .join('  '),
  );

  return [header, divider, ...body].join('\n');
}

function listLabels(items, limit = 16) {
  if (!items.length) {
    return '(none)';
  }
  const labels = items.slice(0, limit).map((item) => graphLabel(item));
  if (items.length > limit) {
    labels.push(`... +${items.length - limit} more`);
  }
  return labels.join(', ');
}

function renderTable(audit) {
  const rows = audit.graphs.map((graph) => ({
    id: graph.id,
    name: graph.name || '(unnamed)',
    nodeCount: graph.nodeCount,
    sourceStatus: graph.sourceStatus,
    mountStatus: graph.mountStatus,
    confidence: graph.confidence,
    evidence: compactEvidence(graph),
    note: graph.note,
  }));
  const columns = [
    { key: 'id', header: 'id', maxWidth: 10 },
    { key: 'name', header: 'name', maxWidth: 28 },
    { key: 'nodeCount', header: 'nodeCount', maxWidth: 9 },
    { key: 'sourceStatus', header: 'sourceStatus', maxWidth: 13 },
    { key: 'mountStatus', header: 'mountStatus', maxWidth: 18 },
    { key: 'confidence', header: 'confidence', maxWidth: 10 },
    { key: 'evidence', header: 'evidence', maxWidth: 48 },
    { key: 'note', header: 'note', maxWidth: 58 },
  ];

  const lines = [];
  lines.push(renderSimpleTable(rows, columns));
  lines.push('');
  lines.push(
    `Summary: .gil graphs=${audit.summary.gilGraphCount}, audited=${audit.summary.selectedGraphCount}, src ids=${audit.summary.srcGraphCount}, source-orphans=${audit.summary.sourceOrphanCount}, likely-unmounted=${audit.summary.likelyUnmountedCount}, ambiguous=${audit.summary.ambiguousCount}, mounted=${audit.summary.mountedCount}`,
  );
  lines.push(`Source-orphan in .gil: ${listLabels(audit.sourceOrphans)}`);
  lines.push(
    `src ids missing in .gil: ${
      audit.srcMissingInGil.length
        ? audit.srcMissingInGil.map((item) => item.id).join(', ')
        : '(none)'
    }`,
  );
  lines.push(`Likely unmounted audited graphs: ${listLabels(audit.likelyUnmounted)}`);
  lines.push(`Ambiguous audited graphs: ${listLabels(audit.ambiguous)}`);
  lines.push(`Focus historical ids present: ${audit.summary.focusIdsPresent.join(', ') || '(none)'}`);
  if (audit.warnings.length > 0) {
    lines.push(`Warnings: ${audit.warnings.join(' | ')}`);
  }
  return `${lines.join('\n')}\n`;
}

function markdownTable(headers, rows) {
  const escapeCell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  return [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

function renderGraphList(items) {
  if (!items.length) {
    return '- (none)';
  }
  return items.map((item) => `- ${graphLabel(item)}`).join('\n');
}

function renderMarkdown(audit) {
  const lines = [];
  lines.push('# NodeGraph Mount Audit');
  lines.push('');
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push(`.gil: \`${audit.gilPath}\``);
  lines.push(`src: \`${audit.srcRoot}\``);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(
    markdownTable(
      ['metric', 'value'],
      [
        ['.gil NodeGraphs', audit.summary.gilGraphCount],
        ['Audited rows', audit.summary.selectedGraphCount],
        ['src graph ids', audit.summary.srcGraphCount],
        ['source-orphan in .gil', audit.summary.sourceOrphanCount],
        ['src ids missing in .gil', audit.summary.srcMissingInGilCount],
        ['mounted', audit.summary.mountedCount],
        ['likely-unmounted', audit.summary.likelyUnmountedCount],
        ['ambiguous', audit.summary.ambiguousCount],
        ['src scanner', `${audit.summary.srcScanner} (${audit.summary.srcFileCount} files)`],
      ],
    ),
  );
  lines.push('');
  lines.push('## Audited Graphs');
  lines.push('');
  lines.push(
    markdownTable(
      ['id', 'name', 'nodes', 'sourceStatus', 'mountStatus', 'confidence', 'evidence', 'note'],
      audit.graphs.map((graph) => [
        graph.id,
        graph.name || '(unnamed)',
        graph.nodeCount,
        graph.sourceStatus,
        graph.mountStatus,
        graph.confidence,
        compactEvidence(graph),
        graph.note,
      ]),
    ),
  );
  lines.push('');
  lines.push('## Source-Orphan Graphs');
  lines.push('');
  lines.push(renderGraphList(audit.sourceOrphans));
  lines.push('');
  lines.push('## Likely-Unmounted Graphs');
  lines.push('');
  lines.push(renderGraphList(audit.likelyUnmounted));
  lines.push('');
  lines.push('## Ambiguous Graphs');
  lines.push('');
  lines.push(renderGraphList(audit.ambiguous));
  lines.push('');
  lines.push('## Focus Historical IDs');
  lines.push('');
  const focusRows = audit.graphs
    .filter((graph) => graph.focus)
    .map((graph) => [
      graph.id,
      graph.name || '(unnamed)',
      graph.sourceStatus,
      graph.mountStatus,
      graph.confidence,
      compactEvidence(graph),
    ]);
  lines.push(
    focusRows.length
      ? markdownTable(['id', 'name', 'sourceStatus', 'mountStatus', 'confidence', 'evidence'], focusRows)
      : '- (none in audited rows)',
  );
  lines.push('');
  lines.push('## Active TS Graph Mount Evidence');
  lines.push('');
  const activeRows = audit.graphs
    .filter((graph) => graph.sourceStatus === 'in-src')
    .map((graph) => [
      graph.id,
      graph.name || '(unnamed)',
      graph.mountStatus,
      graph.confidence,
      graph.mountEvidence.map((item) => `${item.path} x${item.count}`).join('<br>') || '(none)',
      graph.unknownEvidence.map((item) => `${item.path} x${item.count}`).join('<br>') || '(none)',
    ]);
  lines.push(
    activeRows.length
      ? markdownTable(
          ['id', 'name', 'mountStatus', 'confidence', 'mount-candidate paths', 'unknown paths'],
          activeRows,
        )
      : '- (none in audited rows)',
  );
  lines.push('');
  lines.push('## Protobuf Path Signature Appendix');
  lines.push('');
  lines.push(
    audit.pathSignatures.length
      ? markdownTable(
          ['classification', 'path', 'graphs', 'activeGraphs', 'sourceOrphanGraphs', 'refs'],
          audit.pathSignatures.map((item) => [
            item.classification,
            item.path,
            item.graphCount,
            item.activeGraphCount,
            item.sourceOrphanGraphCount,
            item.totalRefCount,
          ]),
        )
      : '- (none)',
  );
  lines.push('');
  lines.push('## Limitations');
  lines.push('');
  lines.push('- This is a read-only audit. It does not modify `.gil`, `src/`, or `gsts.config.ts`.');
  lines.push('- `source-orphan` only means no matching `g.server({ id })` was found under the selected src root.');
  lines.push('- `likely-unmounted` is used only when references are limited to definition/catalog/index/cache paths.');
  lines.push('- `9.*` and unknown paths are reported as `ambiguous` until the `.gil` schema is confirmed.');
  lines.push('- Numeric ID spaces can overlap with editor object/control IDs, so raw varint hits are low-confidence evidence.');
  if (audit.warnings.length > 0) {
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    lines.push(audit.warnings.map((warning) => `- ${warning}`).join('\n'));
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function writeReports(outDir, audit) {
  const absOutDir = resolveInputPath(outDir);
  fs.mkdirSync(absOutDir, { recursive: true });
  fs.writeFileSync(
    path.join(absOutDir, 'nodegraph-mount-audit.json'),
    `${JSON.stringify(audit, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(path.join(absOutDir, 'nodegraph-mount-audit.md'), renderMarkdown(audit), 'utf8');
  return absOutDir;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gilPath = resolveInputPath(args.gil);
  const gilData = readGilGraphs(gilPath);
  const srcScan = await scanSourceIds(args.src);
  const refsById = collectGraphReferences(gilData.payload, gilData.fields, gilData.graphs);
  const audit = buildAudit(args, gilData, srcScan, refsById);

  if (args.format === 'json') {
    process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
  } else if (args.format === 'md') {
    process.stdout.write(renderMarkdown(audit));
  } else {
    process.stdout.write(renderTable(audit));
  }

  if (args.out) {
    const outDir = writeReports(args.out, audit);
    process.stderr.write(`wrote ${displayPath(outDir)}/nodegraph-mount-audit.{json,md}\n`);
  }

  if (args.strict && audit.graphs.some((graph) => graph.mountStatus === 'ambiguous')) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
