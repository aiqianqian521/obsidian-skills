#!/usr/bin/env node
/**
 * Build TF-IDF search index for Obsidian vault.
 * Usage: node build-index.mjs <vaultPath> [--indexDir <path>] [--maxDocBytes <n>] [--maxTokensPerDoc <n>] [--query <q>]
 * Output: {indexDir}/search-index.json
 *
 * Performance notes (2026-09-01):
 *  - Tokenizer rewritten to single-pass O(n): previously text.slice(i).match(...) per run
 *    caused O(n^2) on large notes (e.g. big raw session .raw.md files), making builds
 *    take many minutes. Now ASCII words and CJK chars each extracted in one pass.
 *  - Oversized documents are truncated to a bounded char budget so raw session archives
 *    no longer explode the vocabulary / output size.
 *  - Per-document distinct-token cap keeps the serialized index bounded.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, relative, extname } from "node:path";

// ── Tuning knobs (overridable via CLI flags) ──
const DEFAULT_MAX_DOC_BYTES = 512 * 1024;        // ignore bytes beyond this per doc (after frontmatter strip)
const DEFAULT_MAX_TOKENS_PER_DOC = 15000;        // keep only top-N distinct tokens per doc
const DEFAULT_MAX_QUERY_TOKENS = 64;             // cap tokens for any single query

function parseArg(args, name, dflt) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) {
    const v = parseInt(args[i + 1], 10);
    if (!Number.isNaN(v) && v > 0) return v;
  }
  return dflt;
}

// ── Tokenizer: 2-gram for CJK, word for ASCII — single pass O(n) ──
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const ASCII_WORD_RE = /[A-Za-z0-9_]+/g;

function tokenize(text) {
  const tokens = [];
  ASCII_WORD_RE.lastIndex = 0;
  let m;
  while ((m = ASCII_WORD_RE.exec(text)) !== null) {
    tokens.push(m[0].toLowerCase());
  }
  // CJK chars: single bigram + single (no overlap with ASCII \w)
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (CJK_RE.test(ch)) {
      if (i + 1 < text.length && CJK_RE.test(text[i + 1])) tokens.push(ch + text[i + 1]);
      tokens.push(ch);
    }
  }
  return tokens;
}

// ── Parse frontmatter (keep meta so source_reference is indexable) ──
function parseFrontmatter(content) {
  const meta = {};
  content = content.replace(/^\uFEFF/, ""); // strip UTF-8 BOM if present
  if (content.startsWith("---")) {
    const end = content.indexOf("\n---", 3);
    if (end !== -1 && end > 3) {
      const head = content.slice(3, end);
      let curKey = null;
      for (const l of head.split("\n")) {
        const t = l.trim();
        if (!t) continue;
        if (/^\s*-\s+/.test(l)) {
          // YAML list continuation -> append to current key (e.g. source_reference multi-line list)
          if (curKey !== null && meta[curKey] !== undefined) {
            meta[curKey] = meta[curKey] ? (meta[curKey] + " ") : "";
            meta[curKey] += t.replace(/^-\s+/, "");
          }
          continue;
        }
        const m = l.match(/^([^:]+):\s*(.*)$/);
        if (m) {
          curKey = m[1].trim();
          meta[curKey] = m[2].trim().replace(/^['"]|['"]$/g, "");
        }
      }
      return { body: content.slice(end + 4), meta };
    }
  }
  return { body: content, meta };
}

// ── Read all .md files (oversized docs truncated) ──
function scanVault(vaultPath, maxDocBytes) {
  const docs = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) walk(full);
      } else if (extname(entry.name) === ".md") {
        try {
          let content = readFileSync(full, "utf-8");
          const parsed = parseFrontmatter(content);
          let body = parsed.body;
          const meta = parsed.meta || {};
          if (body.length > maxDocBytes) {
            body = body.slice(0, maxDocBytes);
          }
          const rel = relative(vaultPath, full).replace(/\\/g, "/");
          const title = entry.name.replace(/\.md$/, "");
          // 蒸馏笔记的原始会话锚点：单独存 sourceRef，便于查询结果可跳回原文
          const sourceRef = meta["source_reference"] || "";
          docs.push({ path: rel, title, content: body, meta, sourceRef });
        } catch {}
      }
    }
  }
  walk(vaultPath);
  return docs;
}

// ── Build TF-IDF ──
function buildIndex(docs, maxTokensPerDoc) {
  const df = {};       // document frequency per term
  const tfPerDoc = []; // [{term: count}] per doc

  for (let di = 0; di < docs.length; di++) {
    const doc = docs[di];
    let searchable = doc.content;
    // 将 frontmatter 元数据(source_reference 等)并入可检索文本，使蒸馏笔记能被原始会话锚点搜到
    for (const v of Object.values(doc.meta || {})) {
      if (typeof v === "string" && v) searchable += "\n" + v;
    }
    const tokens = tokenize(searchable);
    const tfCount = {};
    for (const t of tokens) { tfCount[t] = (tfCount[t] || 0) + 1; }
    // keep top-N distinct tokens to bound vocabulary / output size
    const entries = Object.entries(tfCount);
    entries.sort((a, b) => b[1] - a[1]);
    const tf = {};
    const cap = Math.min(maxTokensPerDoc, entries.length);
    for (let k = 0; k < cap; k++) {
      tf[entries[k][0]] = entries[k][1];
      df[entries[k][0]] = (df[entries[k][0]] || 0) + 1;
    }
    tfPerDoc.push({ path: doc.path, title: doc.title, sourceRef: doc.sourceRef || "", tf, totalTokens: tokens.length });
    if ((di + 1) % 50 === 0 || di === docs.length - 1) {
      console.error(`  indexed ${di + 1}/${docs.length}`);
    }
  }

  const N = docs.length;
  const idf = {};
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (count + 1)) + 1;
  }

  return { N, df, idf, docs: tfPerDoc };
}

// ── Search ──
function search(index, query, topK = 10, maxQueryTokens = DEFAULT_MAX_QUERY_TOKENS) {
  const qtokens = tokenize(query).slice(0, maxQueryTokens);
  if (qtokens.length === 0) return [];

  const qvec = {};
  for (const t of qtokens) { qvec[t] = (qvec[t] || 0) + 1; }
  const qnorm = Math.sqrt(Object.values(qvec).reduce((s, v) => s + v * v, 0));

  const scores = index.docs.map(doc => {
    const docNorm = Math.sqrt(Object.values(doc.tf).reduce((s, v) => s + v * v, 0));
    let dot = 0;
    for (const t of Object.keys(qvec)) {
      if (doc.tf[t] && index.idf[t]) {
        dot += (qvec[t] * index.idf[t]) * (doc.tf[t] * index.idf[t]);
      }
    }
    const cosine = (qnorm && docNorm) ? dot / (qnorm * docNorm) : 0;
    return { path: doc.path, title: doc.title, sourceRef: doc.sourceRef || "", score: cosine };
  });

  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}

// ── Main ──
const args = process.argv.slice(2);
const vaultPath = args[0];
const indexDirFlag = args.indexOf("--indexDir");
const indexDir = indexDirFlag !== -1 ? args[indexDirFlag + 1] : join(vaultPath, "99_系统");
const maxDocBytes = parseArg(args, "--maxDocBytes", DEFAULT_MAX_DOC_BYTES);
const maxTokensPerDoc = parseArg(args, "--maxTokensPerDoc", DEFAULT_MAX_TOKENS_PER_DOC);

if (!vaultPath) { console.error("Usage: node build-index.mjs <vaultPath> [--indexDir <path>] [--maxDocBytes <n>] [--maxTokensPerDoc <n>] [--query <q>]"); process.exit(1); }

const t0 = Date.now();
const docs = scanVault(vaultPath, maxDocBytes);
console.error(`Scanned ${docs.length} documents (maxDocBytes=${maxDocBytes})`);

const index = buildIndex(docs, maxTokensPerDoc);
console.error(`Index built: ${Object.keys(index.idf).length} unique terms in ${Math.round((Date.now() - t0) / 1000)}s`);

mkdirSync(indexDir, { recursive: true });
const outFile = join(indexDir, "search-index.json");
writeFileSync(outFile, JSON.stringify(index), "utf-8");
console.error(`Index saved to ${outFile}`);

const queryFlag = args.indexOf("--query");
if (queryFlag !== -1) {
  const query = args[queryFlag + 1];
  const results = search(index, query);
  console.log(JSON.stringify(results, null, 2));
}
