#!/usr/bin/env node
/**
 * playwright-electron-daemon.mjs
 *
 * Long-running daemon that owns the LobeHub Electron process via
 * Playwright's _electron.launch(). Exposes a simple HTTP control API
 * on localhost:7323 so coding agents can take screenshots, eval JS,
 * inspect the accessibility tree, click, type, and navigate — without
 * the attach-race and session-drop issues of CDP attach.
 *
 * By default the daemon starts the desktop renderer Vite dev server on
 * localhost:9876 and injects ELECTRON_RENDERER_URL into the Electron process
 * so renderer HMR keeps working while Playwright owns the Electron lifecycle.
 * A static built-renderer fallback is still available via
 * PLAYWRIGHT_RENDERER_MODE=static.
 *
 * Managed by playwright-electron.sh (start / stop / status / restart).
 *
 * API endpoints (all JSON unless noted):
 *   GET  /status          — { running, url, title }
 *   POST /screenshot      — { path } (PNG written to /tmp)
 *   POST /snapshot        — { snapshot } (accessibility tree text)
 *   POST /eval            — body: { code } → { result }
 *   POST /eval-main       — body: { code } → { result }
 *   POST /click           — body: { selector } or { text }
 *   POST /fill            — body: { selector, value }
 *   POST /type            — body: { selector, text }
 *   POST /press           — body: { key }
 *   POST /navigate        — body: { url }
 *   POST /reload          — reload the window
 *   POST /stop            — graceful shutdown
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PLAYWRIGHT_DAEMON_PORT ?? '7323', 10);
const SPA_PORT = parseInt(process.env.PLAYWRIGHT_SPA_PORT ?? '9876', 10);
const RENDERER_MODE = process.env.PLAYWRIGHT_RENDERER_MODE ?? 'dev';
const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../../../');
const DESKTOP_DIR = path.join(PROJECT_ROOT, 'apps', 'desktop');
const MAIN_ENTRY = path.join(DESKTOP_DIR, 'dist', 'main', 'index.js');
const ELECTRON_BIN = path.join(DESKTOP_DIR, 'node_modules', '.bin', 'electron');
const VITE_BIN = path.join(
  PROJECT_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);
const RENDERER_CONFIG = path.join(DESKTOP_DIR, 'renderer.dev.vite.config.ts');
const RENDERER_DIR = path.join(DESKTOP_DIR, 'dist', 'renderer');
// Use the production profile — it has remoteServerUrl+active:true configured.
// --user-data-dir overrides app.setName() so StoreManager reads the right settings.
// Caveat: the production LobeHub.app must NOT be running at the same time
// (single-instance lock). Run `osascript -e 'quit app "LobeHub"'` first if needed.
const USER_DATA_DIR = path.join(process.env.HOME, 'Library', 'Application Support', 'LobeHub');
const SCREENSHOT_DIR = '/tmp/playwright-electron-screenshots';

// MIME types for the static server
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
};

// ── Preflight checks ─────────────────────────────────────────────────
if (!fs.existsSync(MAIN_ENTRY)) {
  console.error(`[daemon] ERROR: Main entry not found: ${MAIN_ENTRY}`);
  console.error('[daemon] Run: cd apps/desktop && npx electron-vite build');
  process.exit(1);
}

if (RENDERER_MODE === 'static' && !fs.existsSync(RENDERER_DIR)) {
  console.error(`[daemon] ERROR: Renderer dist not found: ${RENDERER_DIR}`);
  console.error('[daemon] Run: bun run build:spa');
  process.exit(1);
}

if (RENDERER_MODE === 'dev' && !fs.existsSync(VITE_BIN)) {
  console.error(`[daemon] ERROR: vite binary not found: ${VITE_BIN}`);
  process.exit(1);
}

if (RENDERER_MODE === 'dev' && !fs.existsSync(RENDERER_CONFIG)) {
  console.error(`[daemon] ERROR: renderer config not found: ${RENDERER_CONFIG}`);
  process.exit(1);
}

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ── Static SPA server ─────────────────────────────────────────────────
let rendererProcess = null;
let spaServer = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, { attempts = 60, delayMs = 500, processRef } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        const status = res.statusCode ?? 500;
        resolve(status >= 200 && status < 400);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2_000, () => {
        req.destroy();
        resolve(false);
      });
    });

    if (ok) return;

    if (processRef?.exitCode !== null && processRef?.exitCode !== undefined) {
      throw new Error(`renderer process exited with code ${processRef.exitCode}`);
    }

    await sleep(delayMs);
  }

  throw new Error(`timed out waiting for ${url}`);
}

async function startStaticRendererServer() {
  spaServer = http.createServer((req, res) => {
    const urlPath = (req.url ?? '/').split('?')[0];
    const ext = path.extname(urlPath);

    let filePath;
    if (ext && ext !== '.html') {
      filePath = path.join(RENDERER_DIR, urlPath);
    } else {
      filePath = path.join(RENDERER_DIR, 'apps', 'desktop', 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        const fallback = path.join(RENDERER_DIR, urlPath);
        fs.readFile(fallback, (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          const mime = MIME[path.extname(fallback)] ?? 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': mime });
          res.end(data2);
        });
        return;
      }
      const mime = MIME[ext] ?? 'text/html; charset=utf-8';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });

  await new Promise((resolve, reject) => {
    spaServer.listen(SPA_PORT, '127.0.0.1', resolve);
    spaServer.on('error', reject);
  });

  const rendererUrl = `http://127.0.0.1:${SPA_PORT}`;
  console.log(`[daemon] Static renderer server on ${rendererUrl}`);
  return rendererUrl;
}

async function startDevRendererServer() {
  console.log(`[daemon] Starting desktop renderer Vite dev server on http://127.0.0.1:${SPA_PORT}`);

  rendererProcess = spawn(
    VITE_BIN,
    ['--config', RENDERER_CONFIG, '--host', '127.0.0.1', '--port', String(SPA_PORT)],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PLAYWRIGHT_SPA_PORT: String(SPA_PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  rendererProcess.stdout?.on('data', (chunk) => {
    process.stdout.write(`[renderer] ${chunk}`);
  });
  rendererProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(`[renderer] ${chunk}`);
  });
  rendererProcess.on('exit', (code, signal) => {
    console.log(
      `[daemon] Renderer dev server exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`,
    );
  });

  const rendererUrl = `http://127.0.0.1:${SPA_PORT}`;
  await waitForUrl(`${rendererUrl}/apps/desktop/index.html`, {
    attempts: 120,
    delayMs: 500,
    processRef: rendererProcess,
  });
  console.log(`[daemon] Renderer dev server ready on ${rendererUrl}`);
  return rendererUrl;
}

async function stopRendererServer() {
  if (rendererProcess && rendererProcess.exitCode === null) {
    rendererProcess.kill('SIGTERM');
    await sleep(500);
    if (rendererProcess.exitCode === null) {
      rendererProcess.kill('SIGKILL');
    }
  }

  if (spaServer) {
    await new Promise((resolve) => spaServer.close(resolve));
  }
}

const rendererUrl =
  RENDERER_MODE === 'static' ? await startStaticRendererServer() : await startDevRendererServer();

// ── Playwright / Electron launch ─────────────────────────────────────
const { _electron } = require(path.join(PROJECT_ROOT, 'node_modules', '@playwright', 'test'));

console.log('[daemon] Launching Electron…');
console.log(`[daemon]   entry:    ${MAIN_ENTRY}`);
console.log(`[daemon]   renderer: ${rendererUrl}`);
console.log(`[daemon]   port:     ${PORT}`);

const electronApp = await _electron.launch({
  executablePath: ELECTRON_BIN,
  // --user-data-dir: forces Electron/Chromium to use the LobeHub production
  // profile so StoreManager reads the already-configured remoteServerUrl.
  args: [MAIN_ENTRY, `--user-data-dir=${USER_DATA_DIR}`],
  cwd: DESKTOP_DIR,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_RENDERER_URL: rendererUrl,
  },
});

// The app calls app.setName('lobehub-desktop-dev') in dev mode, so
// userData resolves to ~/Library/Application Support/lobehub-desktop-dev
// — the existing logged-in profile. No extra configuration needed.

const page = await electronApp.firstWindow();
console.log('[daemon] Window acquired, waiting for SPA…');

// Wait until the React app has mounted (any interactive element visible)
try {
  await page.waitForSelector('button, [role="button"], input, [contenteditable]', {
    timeout: 60_000,
    state: 'visible',
  });
  console.log('[daemon] SPA ready.');
} catch {
  console.warn('[daemon] WARNING: timed out waiting for SPA — proceeding anyway.');
}

// Skip the desktop onboarding screen automatically.
// The completion flag is sessionStorage-based, so it must be set every launch.
// We set it on all open windows so both the main window and floating-chat skip it.
const skipOnboarding = async (win) => {
  try {
    await win.evaluate(`
      window.sessionStorage.setItem('lobechat:desktop:onboarding:completed:v1', '1');
      window.localStorage.removeItem('lobechat:desktop:onboarding:screen:v1');
    `);
  } catch {
    /* window may not have SPA yet */
  }
};

for (const win of electronApp.windows()) {
  await skipOnboarding(win);
}

// If we're on the onboarding route, navigate to the main chat
const currentUrl = page.url();
if (currentUrl.includes('desktop-onboarding')) {
  console.log('[daemon] Onboarding detected — navigating to /chat…');
  await page.goto(`http://localhost:${SPA_PORT}/chat`).catch(() => {});
  await page
    .waitForSelector('button, [role="button"], [contenteditable]', {
      timeout: 30_000,
      state: 'visible',
    })
    .catch(() => {});
}

// ── Helpers ───────────────────────────────────────────────────────────

function jsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function getWindow() {
  const windows = electronApp.windows().filter((w) => !w.isClosed());
  if (windows.length === 0) return page;
  if (windows.length === 1) return windows[0];

  // Prefer the main chat window over the floating-chat overlay.
  // Heuristic: the main window has a non-floating-chat URL and is larger.
  const main = windows.find((w) => !w.url().includes('floating-chat'));
  return main ?? windows[0];
}

// ── HTTP Control API ──────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const { method, url: reqUrl } = req;

  try {
    // GET /status
    if (method === 'GET' && reqUrl === '/status') {
      const win = getWindow();
      const currentUrl = win.url();
      const title = await win.title().catch(() => '');
      return send(res, 200, { running: true, title, url: currentUrl });
    }

    // GET /windows  — list all open windows
    if (method === 'GET' && reqUrl === '/windows') {
      const all = electronApp.windows().filter((w) => !w.isClosed());
      const info = await Promise.all(
        all.map(async (w, i) => ({
          index: i,
          url: w.url(),
          title: await w.title().catch(() => ''),
        })),
      );
      return send(res, 200, { windows: info });
    }

    // POST /stop
    if (method === 'POST' && reqUrl === '/stop') {
      send(res, 200, { ok: true });
      setImmediate(() => {
        electronApp.close().finally(() => {
          stopRendererServer().finally(() => process.exit(0));
        });
      });
      return;
    }

    // POST /screenshot  → { path }
    if (method === 'POST' && reqUrl === '/screenshot') {
      const win = getWindow();
      const filePath = path.join(SCREENSHOT_DIR, `screenshot-${Date.now()}.png`);
      await win.screenshot({ path: filePath, fullPage: false });
      return send(res, 200, { path: filePath });
    }

    // POST /snapshot  → { snapshot }
    if (method === 'POST' && reqUrl === '/snapshot') {
      const win = getWindow();
      const snapshot = await win.locator('body').ariaSnapshot();
      return send(res, 200, { snapshot });
    }

    // POST /eval  { code } → { result }
    if (method === 'POST' && reqUrl === '/eval') {
      const { code } = await jsonBody(req);
      if (!code) return send(res, 400, { error: 'code required' });
      const win = getWindow();
      const result = await win.evaluate(code);
      return send(res, 200, { result });
    }

    // POST /eval-main  { code } → { result }
    if (method === 'POST' && reqUrl === '/eval-main') {
      const { code } = await jsonBody(req);
      if (!code) return send(res, 400, { error: 'code required' });
      const result = await electronApp.evaluate(async ({ app }, source) => {
        const value = new Function('app', `return (${source});`)(app);
        if (typeof value !== 'function') return value;
        return value.length === 0 ? value() : value({ app });
      }, code);
      return send(res, 200, { result });
    }

    // POST /click  { selector? } | { text? }
    if (method === 'POST' && reqUrl === '/click') {
      const body = await jsonBody(req);
      const win = getWindow();
      if (body.text) {
        await win.getByText(body.text, { exact: false }).first().click();
      } else if (body.selector) {
        await win.locator(body.selector).first().click();
      } else {
        return send(res, 400, { error: 'selector or text required' });
      }
      return send(res, 200, { ok: true });
    }

    // POST /fill  { selector, value }
    if (method === 'POST' && reqUrl === '/fill') {
      const { selector, value } = await jsonBody(req);
      if (!selector) return send(res, 400, { error: 'selector required' });
      const win = getWindow();
      await win
        .locator(selector)
        .first()
        .fill(value ?? '');
      return send(res, 200, { ok: true });
    }

    // POST /type  { selector, text }
    if (method === 'POST' && reqUrl === '/type') {
      const { selector, text } = await jsonBody(req);
      if (!selector) return send(res, 400, { error: 'selector required' });
      const win = getWindow();
      await win
        .locator(selector)
        .first()
        .pressSequentially(text ?? '');
      return send(res, 200, { ok: true });
    }

    // POST /press  { key }
    if (method === 'POST' && reqUrl === '/press') {
      const { key } = await jsonBody(req);
      if (!key) return send(res, 400, { error: 'key required' });
      const win = getWindow();
      await win.keyboard.press(key);
      return send(res, 200, { ok: true });
    }

    // POST /navigate  { url }
    if (method === 'POST' && reqUrl === '/navigate') {
      const { url } = await jsonBody(req);
      if (!url) return send(res, 400, { error: 'url required' });
      const win = getWindow();
      await win.goto(url);
      return send(res, 200, { ok: true });
    }

    // POST /reload
    if (method === 'POST' && reqUrl === '/reload') {
      const win = getWindow();
      await win.reload();
      return send(res, 200, { ok: true });
    }

    // POST /mouse-move  { x, y }
    if (method === 'POST' && reqUrl === '/mouse-move') {
      const { x, y } = await jsonBody(req);
      const win = getWindow();
      await win.mouse.move(x, y);
      return send(res, 200, { ok: true });
    }

    // POST /mouse-click  { x, y }
    if (method === 'POST' && reqUrl === '/mouse-click') {
      const { x, y } = await jsonBody(req);
      const win = getWindow();
      await win.mouse.click(x, y);
      return send(res, 200, { ok: true });
    }

    send(res, 404, { error: `Unknown route: ${method} ${reqUrl}` });
  } catch (err) {
    console.error('[daemon] Handler error:', err);
    send(res, 500, { error: String(err?.message ?? err) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[daemon] READY port=${PORT}`);
});

electronApp.on('close', () => {
  console.log('[daemon] Electron closed — shutting down.');
  server.close();
  stopRendererServer().finally(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('[daemon] SIGTERM received — shutting down.');
  await electronApp.close().catch(() => {});
  server.close();
  await stopRendererServer().catch(() => {});
  process.exit(0);
});

process.on('SIGINT', async () => {
  await electronApp.close().catch(() => {});
  server.close();
  await stopRendererServer().catch(() => {});
  process.exit(0);
});
