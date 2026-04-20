# CLAUDE.md — Desktop UI Fork of LobeHub

> Guide for Claude Code (and other AI assistants) working in this repository.
> **This repo is a desktop-UI-only fork of LobeHub.** The LobeHub server runs separately on a hosted instance.
> Your job is to customize the **Electron desktop client UI** — never the server.

For the human-readable contributor guide and the full directory allow/deny list, see [`AGENTS.md`](./AGENTS.md). This file repeats the essentials and adds Claude-specific guidance.

---

## 1. Scope (read this first)

This fork ships **only** the Electron desktop client. Anything backend-shaped that still exists in the tree is upstream code we keep for merge hygiene — **do not modify it**.

### ✅ Work here

- `apps/desktop/` — Electron app (`main/`, `preload/`, `common/`).
- `src/spa/` — SPA entries (`entry.*.tsx`) and React Router config.
- `src/routes/` — Thin SPA page segments.
- `src/features/` — Domain UI (sidebars, panels, editors, etc.).
- `src/components/` — Shared UI.
- `src/store/` — Zustand client stores.
- `src/hooks/` — Client React hooks.
- `src/services/` — Client request builders (may _call_ TRPC, may not modify it).
- `src/styles/`, `src/locales/`, `src/config/`, `src/const/`, `src/types/`, `src/utils/`.

### ⛔ Do not touch

- `src/server/` — Server services and TRPC routers.
- `src/app/` — Next.js App Router (backend pages and API routes).
- `src/app/(backend)/` — Backend API routes.
- `src/instrumentation*.ts` — Server instrumentation.
- `packages/database/` — Drizzle schemas/models/repositories.
- `packages/agent-runtime/` — Server-side agent runtime.
- `docker-compose/`, `Dockerfile` — Deployment artifacts.
- `drizzle.config.ts` — DB migration config.
- `next.config.ts` — Next.js server config.

If a task seems to require any of the above, **stop and flag the scope conflict**. Don't silently refactor server code.

---

## 2. Where to look first

1. **`apps/desktop/Development.md`** — authoritative architecture for the Electron main/preload (managers, controllers, IPC, i18n, updater, shortcuts).
2. **`src/spa/router/`** — SPA route tree.
3. **`src/routes/(desktop)/`, `src/routes/(main)/`** — desktop page segments.
4. **`src/features/`** — most UI work.
5. **`src/store/`** — state changes.
6. **`.agents/skills/`** — auto-loaded skills; read the relevant `SKILL.md` before non-trivial work.

---

## 3. Tech stack

- **Desktop shell:** Electron — main process in `apps/desktop/src/main/`, preload in `apps/desktop/src/preload/`.
- **Renderer:** Vite + React 19 + TypeScript SPA, routed with `react-router-dom`.
- **UI:** `@lobehub/ui` + `antd`, styling with `antd-style`. **Prefer `createStaticStyles` + `cssVar.*`** (zero-runtime). Fall back to `createStyles` + `token` only when styles genuinely need runtime computation. See `.cursor/docs/createStaticStyles_migration_guide.md` if present.
- **State:** `zustand` for client state, `SWR` for data fetching.
- **i18n:** `react-i18next`.
- **Backend transport:** TRPC clients invoked from `src/services/` (read-only from this repo).
- **Tests:** Vitest + Testing Library.

> Next.js still exists in the tree but is **not** this fork's runtime. The desktop app loads the Vite-built SPA. Don't add Next.js-specific code or rely on App Router behavior.

---

## 4. Project structure (essentials)

```plaintext
lobehub/
├── apps/
│   └── desktop/                    # ✅ Electron app — see Development.md
│       └── src/{main,preload,common}/
├── src/
│   ├── spa/                        # ✅ SPA entries + router config
│   │   └── router/
│   │       ├── desktopRouter.config.tsx          # dynamic imports
│   │       └── desktopRouter.config.desktop.tsx  # sync imports — KEEP IN SYNC
│   ├── routes/                     # ✅ Thin route segments
│   │   ├── (main)/  (mobile)/  (desktop)/  onboarding/  share/
│   ├── features/                   # ✅ Domain UI
│   ├── components/                 # ✅ Shared UI
│   ├── store/  hooks/  services/   # ✅ Client logic
│   ├── styles/  config/  const/  types/  utils/  locales/   # ✅
│   ├── server/                     # ⛔ Server services, TRPC routers
│   ├── app/                        # ⛔ Next.js App Router (backend)
│   └── instrumentation*.ts         # ⛔ Server instrumentation
├── packages/
│   ├── database/                   # ⛔ Drizzle, PG schemas
│   └── agent-runtime/              # ⛔ Server agent runtime
├── docker-compose/  Dockerfile     # ⛔ Deployment
├── drizzle.config.ts               # ⛔ DB migrations
├── next.config.ts                  # ⛔ Next.js config
└── .agents/skills/                 # 👀 Auto-loaded skills
```

---

## 5. SPA routes & features

We use a **roots vs features** split:

- **`src/spa/`** — entries (`entry.web.tsx`, `entry.mobile.tsx`, `entry.desktop.tsx`) and React Router configuration.
- **`src/routes/` (roots)** — only page-segment files: `_layout/index.tsx`, `index.tsx`, `[id]/index.tsx`. Keep these **thin** — import from `@/features/*` and compose. No business logic.
- **`src/features/`** — business UI by **domain** (e.g. `Pages`, `PageEditor`, `Home`). Layout chunks, hooks, and domain UI go here. Each feature exports via `index.ts(x)`.

When adding/changing SPA routes:

1. Add only route segment files under `src/routes/` that delegate to features.
2. Implement the layout/page content in `src/features/<Domain>/` and export it.
3. Import via `import { X } from '@/features/<Domain>'`. Do **not** create `features/` folders under `src/routes/`.
4. **Desktop router parity:** update **both** `src/spa/router/desktopRouter.config.tsx` (dynamic imports) and `src/spa/router/desktopRouter.config.desktop.tsx` (sync imports). Paths and nesting must match — **a mismatch causes blank screens** in the desktop build.

See `.agents/skills/spa-routes/SKILL.md` for the full convention.

---

## 6. Development

### Starting the dev environment

```bash
# Frontend-only SPA dev (recommended for UI work)
bun run dev:spa
```

`dev:spa` prints a **Debug Proxy** URL such as:

```
Debug Proxy: https://app.lobehub.com/_dangerous_local_dev_proxy?debug-host=http%3A%2F%2Flocalhost%3A9876
```

Open it to load your local Vite SPA inside the production backend environment with HMR.

For Electron-shell work (windows, IPC, menus, tray, updater, shortcuts), follow `apps/desktop/Development.md`.

### Package management

- `pnpm` for dependency management.
- `bun` to run npm scripts.
- `bunx` for executable npm packages.

### Testing

```bash
# Single test file — always quote the path
bunx vitest run --silent='passed-only' '[file-path]'
```

- **Never** run `bun run test` — it runs the entire suite (\~10 min), including server tests we do not own.
- Prefer `vi.spyOn` over `vi.mock`.
- Tests must pass `bun run type-check`.
- After two failed fix attempts on a test, stop and ask.

### i18n

- Add keys to `src/locales/default/<namespace>.ts`.
- For local preview, translate `locales/zh-CN/<namespace>.json` and/or `locales/en-US/<namespace>.json`.
- Don't run `pnpm i18n` — CI handles it.

---

## 7. Git workflow

- **Branches:** `canary` is the development branch; `main` is the release branch (periodically cherry-picks from canary).
- Branch from `canary`. PRs target `canary`.
- Use `git pull --rebase`.
- Branch format: `<type>/<feature-name>` (e.g. `feat/desktop-tab-strip`).
- Commit messages prefix with **gitmoji** (`:sparkles:`, `:bug:`, `:lipstick:`, …).
- **Never** run destructive Git commands (`git restore`, `git checkout --`, `git reset --hard`, etc.) against files with uncommitted local changes without explicit user confirmation.

---

## 8. Skills

Skills under `.agents/skills/` are auto-loaded by Claude Code when relevant. Useful in this fork:

- `spa-routes`, `react`, `zustand`, `i18n`, `hotkey`, `modal`, `microcopy`, `typescript`, `testing`, `code-review`.

When reviewing code or diffs, **always read `.agents/skills/code-review/SKILL.md` first**.

Backend-oriented skills (`trpc-router`, `drizzle`, `db-migrations`, `upstash-workflow`, etc.) are **out of scope** for this fork — if a task seems to require them, you've crossed the line into server territory.

---

## 9. Pre-edit checklist

Before changing any file, confirm:

1. ☐ The file is under an **ALLOWED** path (Section 1).
2. ☐ The change is **client/UI** behavior, not server logic.
3. ☐ If editing SPA routes, both `desktopRouter.config.tsx` files will be kept in sync.
4. ☐ If adding i18n keys, the default locale and at least one preview locale are updated.
5. ☐ A targeted `bunx vitest run` covers the change (no full-suite runs).

If any box is unchecked, stop and reconsider.
