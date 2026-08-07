#!/usr/bin/env node
/**
 * scripts/screenshot.mjs — visual + health capture for the QA loop.
 *
 * Captures the target page at each requested width and writes PNGs to qa/screens/.
 * A screenshot alone is a weak signal, so this also collects console errors,
 * uncaught page errors, failed network requests, broken images, and a
 * horizontal-overflow measurement, and EXITS NON-ZERO if any fire.
 * See docs/DECISIONS.md ADR-003.
 *
 * Usage:
 *   node scripts/screenshot.mjs
 *   node scripts/screenshot.mjs --path=/ --label=baseline --widths=1440,768,375
 *   node scripts/screenshot.mjs --url=http://127.0.0.1:9292/collections/all --label=coll
 *   node scripts/screenshot.mjs --selector="[data-tisso-wild]" --label=wild
 *
 * Flags:
 *   --url=       full URL (overrides --base/--path)
 *   --base=      origin of the dev server        (default http://127.0.0.1:9292)
 *   --path=      path on the origin              (default /)
 *   --label=     filename prefix                 (default "shot")
 *   --widths=    comma-separated viewport widths (default 1440,768,375)
 *   --height=    viewport height                 (default 900)
 *   --out=       output directory                (default qa/screens)
 *   --selector=  additionally capture this element to <label>-<width>-el.png
 *   --retries=   retries per width for transient failures only (default 2)
 *   --no-full    skip the full-page capture
 *   --lenient    still write PNGs, but do not fail the run on health errors
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.length ? rest.join('=') : true];
  })
);

const BASE = argv.base || 'http://127.0.0.1:9292';
const TARGET = argv.url || new URL(argv.path || '/', BASE).toString();
const LABEL = argv.label || 'shot';
const WIDTHS = String(argv.widths || '1440,768,375')
  .split(',')
  .map((w) => parseInt(w.trim(), 10))
  .filter(Boolean);
const HEIGHT = parseInt(argv.height || '900', 10);
const OUT = argv.out || path.join('qa', 'screens');
const RETRIES = parseInt(argv.retries || '2', 10);
const FULL = !argv['no-full'];
const LENIENT = Boolean(argv.lenient);

/**
 * Platform noise allowlist — calibrated against UNTOUCHED **Dawn 15.5.0**
 * (docs/PROGRESS.md P1.8/P1.10). Every entry fires on stock theme code with zero
 * features added, caused by `shopify theme dev` proxying the storefront from
 * http://127.0.0.1:9292 instead of the real domain.
 *
 * Suppressed so the harness can fail on OUR bugs. Suppression is anchored to
 * specific URLs wherever possible; the few message-text patterns below
 * (IGNORED_CONSOLE_PATTERNS) exist only for events whose console location
 * carries no usable URL, and each is backed by the URL-scoped request check,
 * which stays authoritative. Suppressed counts print on every run — nothing
 * hides silently.
 *
 * DO NOT add an entry to make a failing run go green. Add only when you can
 * reproduce the event on stock **Dawn**, and say why in the comment.
 *
 * ⚠ This list is theme-specific. It was originally calibrated against Horizon
 * and silently rotted when the project moved to Dawn: `/api/collect` did not
 * match Dawn's `/api/event/collect`, producing a 1-in-5 false failure that read
 * as flakiness. Re-validate on any theme change — 5 consecutive green runs
 * (SPEC S0.11), never one.
 */
const IGNORED_REQUEST_PATTERNS = [
  /\/wpm@/,                              // Web Pixels Manager
  /web-pixels@/,                         // web pixel sandbox; aborted on teardown
  /monorail-edge/,                       // analytics beacon
  /\/api\/(event\/)?collect/,            // analytics beacon — Horizon posts /api/collect, Dawn /api/event/collect
  /origin_trials-[a-f0-9]+\.js/,         // Chrome origin-trial script, CORS-blocked from 127.0.0.1
  /\/services\/login_with_shop\//,       // Login with Shop embed rejects the dev origin
  /shop\.app\//,                         // Shop Pay / shop.app embed, same cause
  /\/sf_private_access_tokens/,          // Storefront API token exchange, 400 via dev proxy
  /\/api\/\d{4}-\d{2}\/graphql\.json/,   // Storefront API, 400 via dev proxy
  /^blob:/,                              // media blobs aborted on navigation
  /\/\.well-known\//,                    // browser probes (DevTools, passkeys); never theme-owned
  /favicon\.ico$/,                       // absent favicon on a dev store; cannot mask a section defect
];

const IGNORED_CONSOLE_PATTERNS = [
  /blocked by CORS policy/,                          // origin_trials script, see above
  /violates the following Content Security Policy/,   // shop.app frame-ancestors vs dev origin
  /\[shopify-account\] Menu ".*" not found/,          // store has no customer-account menu configured
  /Failed to load resource: net::ERR_FAILED/,         // console echo of an already-ignored request
];

/**
 * Console messages originating from `chrome-error://chromewebdata/` are echoes
 * from a failed CROSS-ORIGIN SUBFRAME (here: the shop.app auth embed 403). The
 * underlying request is judged on its own merits by the request-level checks
 * above, which are authoritative — so dropping the echo loses no signal.
 */
const IGNORED_CONSOLE_ORIGINS = [/^chrome-error:\/\/chromewebdata\//];

/**
 * Transient-class failures: `shopify theme dev` intermittently 502s while
 * proxying Shopify's image CDN — a different asset each run. These are retried
 * rather than allowlisted, because an image that is PERSISTENTLY broken is a
 * real defect the harness must still catch.
 */
const TRANSIENT_PATTERNS = [/\/cdn\/shop\/.*\.(jpg|jpeg|png|webp|gif|avif|svg)/i];

const isIgnorable = (url) => Boolean(url) && IGNORED_REQUEST_PATTERNS.some((re) => re.test(url));
const isIgnorableConsole = (msg) => {
  const url = msg.location()?.url;
  if (isIgnorable(url)) return true;
  if (url && IGNORED_CONSOLE_ORIGINS.some((re) => re.test(url))) return true;
  return IGNORED_CONSOLE_PATTERNS.some((re) => re.test(msg.text()));
};
const isTransient = (url) => Boolean(url) && TRANSIENT_PATTERNS.some((re) => re.test(url));

async function preflight(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

/** One capture attempt at one width. Returns everything measured. */
async function captureOnce(browser, width, attempt) {
  const isMobile = width <= 480;
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
    userAgent: isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];
  let suppressed = 0;

  page.on('console', (msg) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    if (isIgnorableConsole(msg)) { suppressed++; return; }
    const entry = { text: msg.text(), location: msg.location(), url: msg.location()?.url };
    if (type === 'error') consoleErrors.push(entry);
    else consoleWarnings.push(entry);
  });
  page.on('pageerror', (err) => pageErrors.push({ message: err.message, stack: err.stack }));
  page.on('requestfailed', (req) => {
    if (isIgnorable(req.url())) { suppressed++; return; }
    failedRequests.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText });
  });
  page.on('response', (res) => {
    if (res.status() < 400) return;
    if (isIgnorable(res.url())) { suppressed++; return; }
    failedRequests.push({ url: res.url(), method: res.request().method(), status: res.status() });
  });

  // NOTE: never wait for 'networkidle' here. The Shopify storefront keeps
  // long-lived connections open (web pixels, analytics beacons, hot reload), so
  // networkidle never fires and every capture times out. Wait for 'load', then
  // settle lazy images explicitly.
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('load', { timeout: 60_000 }).catch(() => {});
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        y += window.innerHeight;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 100);
        else { window.scrollTo(0, 0); setTimeout(resolve, 300); }
      };
      step();
    });
  });
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(600);

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    title: document.title,
    imagesTotal: document.images.length,
    imagesBroken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
    brokenSrcs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
  }));
  const overflow = metrics.scrollWidth > metrics.innerWidth;

  const shot = path.join(OUT, `${LABEL}-${width}.png`);
  await page.screenshot({ path: shot });
  const files = [shot];

  if (FULL) {
    const fullShot = path.join(OUT, `${LABEL}-${width}-full.png`);
    await page.screenshot({ path: fullShot, fullPage: true });
    files.push(fullShot);
  }

  if (argv.selector) {
    const el = page.locator(String(argv.selector)).first();
    if (await el.count()) {
      const elShot = path.join(OUT, `${LABEL}-${width}-el.png`);
      await el.screenshot({ path: elShot });
      files.push(elShot);
    } else {
      console.warn(`  ! selector "${argv.selector}" not found at ${width}px`);
    }
  }

  await context.close();

  // Classify: is every problem in this attempt of the transient class?
  const problems = [
    ...failedRequests.map((r) => r.url),
    ...consoleErrors.map((e) => e.url).filter(Boolean),
    ...metrics.brokenSrcs,
  ];
  const hasNonTransient =
    pageErrors.length > 0 ||
    overflow ||
    consoleErrors.some((e) => !isTransient(e.url)) ||
    failedRequests.some((r) => !isTransient(r.url)) ||
    metrics.brokenSrcs.some((s) => !isTransient(s));
  const healthy =
    consoleErrors.length === 0 &&
    pageErrors.length === 0 &&
    failedRequests.length === 0 &&
    !overflow &&
    metrics.imagesBroken === 0;

  return {
    width, attempt, files,
    bytes: files.map((f) => statSync(f).size),
    metrics, overflow,
    consoleErrors, consoleWarnings, pageErrors, failedRequests,
    suppressed, problems, hasNonTransient, healthy,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log(`→ target   ${TARGET}`);
  console.log(`→ widths   ${WIDTHS.join(', ')}`);
  console.log(`→ out      ${OUT}/\n`);

  const pre = await preflight(TARGET);
  if (!pre.ok) {
    // Distinguish the failure modes — they need different fixes, and a generic
    // "not answering" sent us chasing a phantom determinism bug once already.
    let diagnosis;
    if (pre.status === 401 || pre.status === 403) {
      diagnosis =
        `  The dev server is UP but the storefront-password session has EXPIRED.\n` +
        `  \`shopify theme dev\` holds a storefront_digest cookie that times out on a\n` +
        `  password-protected store; every request then 401s. This is not a theme bug\n` +
        `  and not harness flakiness — restart the dev server:\n` +
        `    pkill -f "shopify theme dev"\n` +
        `    shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com \\\n` +
        `      --store-password=<storefront password> --live-reload off`;
    } else if (pre.status === 500) {
      diagnosis =
        `  The dev server is UP but returning 500. Most likely the CLI reused a\n` +
        `  development theme created from a DIFFERENT base theme, leaving colliding\n` +
        `  files. Delete the stale development theme and let the CLI recreate it:\n` +
        `    shopify theme list --store=…   # find the [development] entry\n` +
        `    shopify theme delete --theme <id> --force`;
    } else {
      diagnosis =
        `  Start the dev server first:\n` +
        `    shopify theme dev --store=abdulrhman-magdy-48-teststore.myshopify.com \\\n` +
        `      --store-password=<storefront password> --live-reload off`;
    }
    console.error(
      `✗ ${TARGET} preflight failed (status ${pre.status}${pre.error ? `: ${pre.error}` : ''}).\n` +
        diagnosis +
        `\n  A blank screenshot is worse than no screenshot — refusing to capture.`
    );
    process.exit(2);
  }

  const browser = await chromium.launch();
  const results = [];
  let healthFailures = 0;

  for (const width of WIDTHS) {
    let res;
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      res = await captureOnce(browser, width, attempt);
      // Retry only when every problem is transient — a real bug must not be retried away.
      if (res.healthy || res.hasNonTransient || attempt === RETRIES) break;
      console.log(`  ↻ ${width}px attempt ${attempt}: transient CDN failure, retrying — ${res.problems.join(', ')}`);
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!res.healthy) healthFailures++;
    results.push(res);

    console.log(`${res.healthy ? '✓' : '✗'} ${width}px  →  ${res.files.map((f) => path.basename(f)).join(', ')}${res.attempt > 1 ? `  (attempt ${res.attempt})` : ''}`);
    console.log(`    ${res.bytes.map((b) => `${(b / 1024).toFixed(0)}KB`).join(', ')}  ·  scrollWidth ${res.metrics.scrollWidth} / innerWidth ${res.metrics.innerWidth}${res.overflow ? '  ← HORIZONTAL OVERFLOW' : ''}`);
    // The storefront-password session can expire DURING a run: preflight passes
    // at 200, then assets start 401ing mid-capture. Without this, it reads as a
    // theme defect or as harness flakiness. It is neither.
    const authFailures = res.failedRequests.filter((r) => r.status === 401 || r.status === 403);
    if (authFailures.length) {
      console.log(`    ⚠ ${authFailures.length} request(s) returned 401/403 — the storefront-password session expired MID-RUN.`);
      console.log(`      Not a theme defect. Restart the dev server and re-run; do not chase this as a bug.`);
    }
    if (res.metrics.imagesBroken) console.log(`    ✗ ${res.metrics.imagesBroken}/${res.metrics.imagesTotal} images failed to load: ${res.metrics.brokenSrcs.join(', ')}`);
    for (const e of res.consoleErrors) console.log(`    ✗ console.error: ${e.text}`);
    for (const e of res.pageErrors) console.log(`    ✗ pageerror: ${e.message}`);
    for (const r of res.failedRequests) console.log(`    ✗ request ${r.status || r.failure}: ${r.url}`);
    if (res.consoleWarnings.length) console.log(`    · ${res.consoleWarnings.length} console warning(s) (non-fatal)`);
    if (res.suppressed) console.log(`    · ${res.suppressed} known Shopify/dev-proxy event(s) suppressed (see allowlist in this script)`);
  }

  await browser.close();

  const report = {
    target: TARGET,
    label: LABEL,
    capturedAt: new Date().toISOString(),
    widths: WIDTHS,
    healthy: healthFailures === 0,
    results,
  };
  const reportPath = path.join(OUT, `${LABEL}-report.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n→ report   ${reportPath}`);

  if (healthFailures > 0) {
    console.error(`\n✗ ${healthFailures}/${WIDTHS.length} width(s) failed health checks. PNGs were still written — read them and the JSON report.`);
    if (!LENIENT) process.exit(1);
    console.error('  (--lenient set: exiting 0 anyway)');
  } else {
    console.log(`\n✓ all ${WIDTHS.length} width(s) captured clean.`);
  }
}

main().catch((err) => {
  console.error('✗ screenshot run crashed:', err);
  process.exit(3);
});
