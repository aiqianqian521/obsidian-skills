#!/usr/bin/env node
/**
 * Wikilink graph explorer for Obsidian vault.
 * Parses [[wikilinks]] from all .md files, builds adjacency graph,
 * supports BFS traversal from a starting concept.
 *
 * Usage:
 *   node graph-explore.mjs <vaultPath> --from "概念名" [--depth 2] [--build]
 *   node graph-explore.mjs <vaultPath> --stats
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

// ── Parse wikilinks from markdown content ──
const WIKILINK_RE = /\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;

function parseWikilinks(content) {
  const targets = new Set();
  for (const m of content.matchAll(WIKILINK_RE)) {
    targets.add(m[1].trim());
  }
  return [...targets];
}

// ── Normalize note name for graph lookup ──
function noteName(filePath) {
  return basename(filePath, ".md");
}

// ── Build adjacency graph ──
function buildGraph(vaultPath) {
  const outgoing = {};  // source -> [targets]
  const incoming = {};  // target -> [sources]
  const allNodes = new Set();

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) walk(full);
      } else if (extname(entry.name) === ".md") {
        const rel = relative(vaultPath, full).replace(/\\/g, "/");
        const src = noteName(rel);
        allNodes.add(src);
        try {
          const content = readFileSync(full, "utf-8");
          const targets = parseWikilinks(content);
          if (targets.length > 0) {
            outgoing[src] = [...new Set(targets)];
            for (const t of targets) {
              if (!incoming[t]) incoming[t] = [];
              incoming[t].push(src);
              allNodes.add(t);
            }
          }
        } catch {}
      }
    }
  }
  walk(vaultPath);

  // Resolve wikilink targets to actual file names (case-insensitive)
  const fileNames = new Set();
  for (const n of allNodes) fileNames.add(n.toLowerCase());
  const resolveMap = {};
  for (const n of allNodes) {
    for (const f of fileNames) {
      if (f === n.toLowerCase()) { resolveMap[n.toLowerCase()] = n; break; }
    }
  }

  return { outgoing, incoming, allNodes: [...allNodes], fileCount: allNodes.size };
}

// ── BFS traversal ──
function bfsExplore(graph, start, maxDepth = 2, maxResults = 30) {
  const visited = new Set();
  const queue = [{ node: start, depth: 0 }];
  const result = { nodes: [], edges: [] };

  // Build case-insensitive lookup
  const nodeLookup = {};
  for (const n of graph.allNodes) { nodeLookup[n.toLowerCase()] = n; }

  // Resolve start node
  const startKey = Object.keys(nodeLookup).find(k => k === start.toLowerCase() || k.includes(start.toLowerCase()));
  const actualStart = startKey ? nodeLookup[startKey] : start;

  // Resolver function
  const resolve = (name) => {
    const key = Object.keys(nodeLookup).find(k => k === name.toLowerCase() || k.endsWith("/" + name.toLowerCase()));
    return key ? nodeLookup[key] : name;
  };

  visited.add(actualStart);
  result.nodes.push({ name: actualStart, depth: 0, type: "start" });

  while (queue.length > 0 && result.nodes.length < maxResults) {
    const { node, depth } = queue.shift();
    if (depth >= maxDepth) continue;

    // Outgoing links
    const outLinks = (graph.outgoing[node] || []).map(resolve).filter(Boolean);
    for (const target of [...new Set(outLinks)]) {
      if (!visited.has(target)) {
        visited.add(target);
        result.nodes.push({ name: target, depth: depth + 1, type: "linked" });
        result.edges.push({ from: node, to: target, direction: "outgoing" });
        queue.push({ node: target, depth: depth + 1 });
      } else if (!result.edges.some(e => e.from === node && e.to === target)) {
        result.edges.push({ from: node, to: target, direction: "outgoing" });
      }
    }

    // Incoming links (backlinks)
    const inLinks = (graph.incoming[node] || []).map(resolve).filter(Boolean);
    for (const source of [...new Set(inLinks)]) {
      if (!visited.has(source)) {
        visited.add(source);
        result.nodes.push({ name: source, depth: depth + 1, type: "backlink" });
        result.edges.push({ from: source, to: node, direction: "incoming" });
        queue.push({ node: source, depth: depth + 1 });
      }
    }
  }

  return result;
}

// ── Main ──
const args = process.argv.slice(2);
const vaultPath = args[0];

if (!vaultPath) {
  console.error("Usage: node graph-explore.mjs <vaultPath> [--from <note>] [--depth N] [--stats]");
  process.exit(1);
}

const statsFlag = args.includes("--stats");
const fromFlag = args.indexOf("--from");
const depthFlag = args.indexOf("--depth");
const startNote = fromFlag !== -1 ? args[fromFlag + 1] : null;
const maxDepth = depthFlag !== -1 ? parseInt(args[depthFlag + 1], 10) : 2;

const graph = buildGraph(vaultPath);

if (statsFlag) {
  const withLinks = Object.keys(graph.outgoing).length;
  const withBacklinks = Object.keys(graph.incoming).length;
  const totalEdges = Object.values(graph.outgoing).reduce((s, t) => s + t.length, 0);
  console.log(JSON.stringify({
    totalNotes: graph.allNodes.length,
    notesWithOutgoingLinks: withLinks,
    notesWithIncomingLinks: withBacklinks,
    totalEdges,
    avgOutDegree: (totalEdges / withLinks).toFixed(2),
  }, null, 2));
} else if (startNote) {
  const result = bfsExplore(graph, startNote, maxDepth);
  console.log(JSON.stringify({
    start: startNote,
    depth: maxDepth,
    nodesFound: result.nodes.length,
    nodes: result.nodes,
    edges: result.edges,
  }, null, 2));
} else {
  console.error("Specify --from <note> to explore, or --stats for graph stats");
  process.exit(1);
}