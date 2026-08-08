#!/usr/bin/env node
/**
 * scripts/figma-fetch.mjs — the ONLY thing in this project that talks to the Figma API.
 *
 * Everything else reads `qa/figma/*.json`. Per docs/DECISIONS.md ADR-012, a
 * verification pass that issues HTTP requests is a bug: re-verification must be
 * free, or it gets skipped.
 *
 * Access rules encoded here, learned from tripping the throttle:
 *
 *  1. `GET /v1/files/:key` is by far the most expensive endpoint Figma exposes.
 *     Fetch it ONCE. This script refuses to re-fetch it unless --force is given.
 *  2. Everything else uses `GET /v1/files/:key/nodes?ids=a,b,c&depth=N` —
 *     comma-separate the ids so several subtrees arrive in ONE request, and set
 *     depth so whole trees are not dragged back unread.
 *  3. Requests are SERIALISED — never parallel. On 429, honour the `Retry-After`
 *     header exactly rather than guessing, then exponential backoff on repeats.
 *  4. Every 429 is logged with what was done about it, so the record shows the
 *     throttle was handled rather than worked around.
 *
 * The token is read from FIGMA_TOKEN and is never written to disk.
 *
 * Usage:
 *   FIGMA_TOKEN=… node scripts/figma-fetch.mjs file
 *   FIGMA_TOKEN=… node scripts/figma-fetch.mjs nodes 1:1664,1:1590 --depth=3 --out=frames
 *   FIGMA_TOKEN=… node scripts/figma-fetch.mjs image 1:1588 --scale=3 --out=…
 */

import { writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const FILE_KEY = process.env.FIGMA_FILE_KEY || 'EOnLQN0Q4BDBYH7Hh0N59T';
const TOKEN = process.env.FIGMA_TOKEN;
const CACHE = 'qa/figma';

if (!TOKEN) {
  console.error('✗ FIGMA_TOKEN is not set. Pass it as an env var; never write it to a file (the repo is PUBLIC).');
  process.exit(2);
}

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = Object.fromEntries(
  argv.filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...r] = a.replace(/^--/, '').split('=');
    return [k, r.length ? r.join('=') : true];
  })
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One serialised request with correct 429 handling.
 * Figma returns Retry-After (seconds) on throttle — honour it rather than guess.
 */
async function get(url, label) {
  const MAX = 6;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    const res = await fetch(url, { headers: { 'X-Figma-Token': TOKEN } });

    if (res.status === 429) {
      const hdr = res.headers.get('retry-after');
      // Honour Retry-After exactly when present; otherwise exponential backoff.
      const waitMs = hdr ? Math.ceil(Number(hdr) * 1000) : Math.min(60_000, 2 ** attempt * 1000);
      const how = hdr ? `Retry-After: ${hdr}s` : `no Retry-After header → exponential backoff`;
      console.error(`  ⏳ 429 on ${label} (attempt ${attempt}/${MAX}) — ${how}; waiting ${Math.round(waitMs / 1000)}s`);
      if (attempt === MAX) {
        console.error(`  ✗ still throttled after ${MAX} attempts — giving up on ${label}`);
        return null;
      }
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      console.error(`  ✗ ${label}: HTTP ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  }
  return null;
}

/**
 * A cache hit means VALID cached data, not merely a file on disk.
 *
 * This distinction is not theoretical: an early `curl -o qa/figma/file.json`
 * that hit a 429 wrote the 42-byte error body `{"status":429,...}` to the cache
 * path. An existence check would treat that as cached forever and every
 * downstream verification would read an error object as if it were the design.
 * Validate the shape, and treat an API error body as no cache at all.
 */
async function cachedOk(p, requiredKey) {
  try {
    const raw = await readFile(p, 'utf8');
    const data = JSON.parse(raw);
    if (data.status && data.err) return false;   // an API error body, not data
    return Boolean(data[requiredKey]);
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(CACHE, { recursive: true });

  if (cmd === 'file') {
    const out = path.join(CACHE, 'file.json');
    if ((await cachedOk(out, 'document')) && !flags.force) {
      console.log(`✓ ${out} already cached — refusing to re-fetch the full-file endpoint.`);
      console.log(`  It is the most expensive call Figma exposes and ADR-012 says fetch it once.`);
      console.log(`  Pass --force only if you have concrete reason to believe it is stale.`);
      return;
    }
    console.log(`→ GET /v1/files/${FILE_KEY}  (full document — this is the expensive one, once only)`);
    const data = await get(`https://api.figma.com/v1/files/${FILE_KEY}`, 'full file');
    if (!data) process.exit(1);
    await writeFile(out, JSON.stringify(data));
    const bytes = (await stat(out)).size;
    console.log(`✓ cached ${out} (${(bytes / 1024 / 1024).toFixed(2)} MB) — name "${data.name}", lastModified ${data.lastModified}`);
    return;
  }

  if (cmd === 'nodes') {
    const ids = argv[1];
    if (!ids) { console.error('✗ usage: nodes <id,id,id> [--depth=N] [--out=name]'); process.exit(2); }
    const depth = flags.depth ? `&depth=${flags.depth}` : '';
    const out = path.join(CACHE, `nodes-${flags.out || 'adhoc'}.json`);
    console.log(`→ GET /nodes?ids=${ids}${depth}  (${ids.split(',').length} subtree(s) in ONE request)`);
    const data = await get(
      `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(ids)}${depth}`,
      `nodes ${ids}`
    );
    if (!data) process.exit(1);
    await writeFile(out, JSON.stringify(data, null, 2));
    console.log(`✓ cached ${out}`);
    for (const k of Object.keys(data.nodes || {})) {
      const n = data.nodes[k]?.document;
      if (n) console.log(`    ${k}  ${n.type}  "${n.name}"`);
    }
    return;
  }

  if (cmd === 'image') {
    const ids = argv[1];
    const scale = flags.scale || 2;
    console.log(`→ GET /v1/images  ids=${ids} scale=${scale}`);
    const data = await get(
      `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=${scale}`,
      `image ${ids}`
    );
    if (!data?.images) process.exit(1);
    for (const [id, url] of Object.entries(data.images)) {
      if (!url) { console.error(`  ✗ ${id}: no render returned`); continue; }
      const dest = flags.out || path.join('design-reference', `figma-${id.replace(':', '-')}-${scale}x.png`);
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(dest, buf);
      console.log(`✓ ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
    return;
  }

  console.error('✗ usage: figma-fetch.mjs <file|nodes|image> [args]');
  process.exit(2);
}

main().catch((e) => { console.error('✗ crashed:', e.message); process.exit(3); });
