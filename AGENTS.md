# AGENTS.md — Desktop UI Fork of LobeHub

> **READ THIS FIRST.** This repository is a **desktop-UI-only fork** of LobeHub.
> The LobeHub server runs on a separate hosted instance — **this repo never ships server code.**
> Your job as an AI agent is to customize the Electron desktop client UI **and nothing else**.

---

## 1. Scope of this fork (the most important section)

This fork exists to customize the **Electron desktop app** and its **renderer (SPA) UI**. The SPA built here is bundled into the Electron app under `apps/desktop/` and points at a remote LobeHub backend.

Treat this repo as a **client only**. Server code that still lives in the tree is upstream baggage we keep around to make merges from upstream easier — **do not modify it**.

### ✅ ALLOWED — work freely here

| Path              | What it is                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `apps/desktop/`   | Electron app: `main/` (Node), `preload/`, `common/`. Desktop-specific features.                 |
| `src/spa/`        | SPA entries (`entry.web.tsx`, `entry.mobile.tsx`, `entry.desktop.tsx`) and React Router config. |
| `src/routes/`     | SPA page segments (thin: layout + page, delegate to `features/`).                               |
| `src/features/`   | Business UI components by domain (sidebars, panels, editors, etc.).                             |
| `src/components/` | Shared/reusable UI components.                                                                  |
| `src/store/`      | Zustand client stores.                                                                          |
| `src/hooks/`      | Client-side React hooks.                                                                        |
| `src/services/`   | Client services that build requests against the remote backend.                                 |
| `src/styles/`     | Global styles, themes.                                                                          |
| `src/locales/`    | i18n translations and default keys.                                                             |
| `src/config/`     | Client-side configuration.                                                                      |
| `src/const/`      | Constants (client).                                                                             |
| `src/types/`      | TypeScript types shared across the client.                                                      |
| `src/utils/`      | Pure utility functions.                                                                         |

### ⛔ OFF-LIMITS — do not edit, do not refactor, do not "tidy up"

| Path                                                | Why it is off-limits                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/server/`                                       | Server services and TRPC routers. Owned by the hosted backend.                            |
| `src/app/`                                          | Next.js App Router (backend pages, API routes, SSR auth). Not built/shipped by this fork. |
| `src/app/(backend)/`                                | Backend API routes (TRPC, webapi, OIDC, etc.).                                            |
| `src/instrumentation.ts`, `src/instrumentation*.ts` | Server instrumentation/observability.                                                     |
| `packages/database/`                                | Drizzle schemas, models, repositories. Backend-only.                                      |
| `packages/agent-runtime/`                           | Server-side agent runtime.                                                                |
| `docker-compose/`, `Dockerfile`                     | Server deployment artifacts.                                                              |
| `drizzle.config.ts`                                 | DB migration config.                                                                      |
| `next.config.ts`                                    | Next.js server configuration.                                                             |

If a task seems to require touching anything in the off-limits list, **stop and surface the conflict** instead of making changes. The right answer is almost always "do it on the client" or "request it from the backend team."

> Note: many `src/services/*` modules call TRPC procedures defined in `src/server/`. You may **call** those procedures from the client; you may not **modify** them.

---

## 2. Where to look first

When picking up a new desktop UI task:

1. **`apps/desktop/Development.md`** — authoritative guide to the Electron main/preload architecture (managers, controllers, IPC, i18n, updater, shortcuts).
2. **`src/spa/router/`** — the SPA route tree (see desktop router parity rule below).
3. **`src/routes/(desktop)/` and `src/routes/(main)/`** — desktop page segments.
4. **`src/features/`** — most UI work happens here.
5. **`src/store/`** — for state changes.
6. **`.agents/skills/`** — auto-loaded skills (spa-routes, react, zustand, i18n, hotkey, modal, etc.). Read the relevant SKILL.md before non-trivial work.

---

## 3. Tech stack

- **Desktop shell:** Electron (main process under `apps/desktop/src/main/`, preload under `apps/desktop/src/preload/`).
- **Renderer:** Vite + React 19 + TypeScript SPA, routed with `react-router-dom`.
- **UI:** `@lobehub/ui` + `antd`, styled with `antd-style`. **Prefer `createStaticStyles` with `cssVar.*`** (zero-runtime); only fall back to `createStyles` + `token` when styles need runtime computation.
- **State:** `zustand` for client state, `SWR` for data fetching.
- **i18n:** `react-i18next`.
- **Backend transport (read-only from this repo):** TRPC clients in `src/services/`.
- **Testing:** Vitest + Testing Library.

> Next.js exists in the tree but is **not** the runtime for this fork. The desktop app loads the Vite-built SPA. Don't add Next.js-specific code.

---

## 4. Directory map (quick reference)

```plaintext
lobehub/
├── apps/
│   └── desktop/                    # ✅ Electron app
│       ├── Development.md          # 👀 Read this for desktop architecture
│       └── src/{main,preload,common}/
├── src/
│   ├── spa/                        # ✅ SPA entries + router config
│   │   └── router/
│   │       ├── desktopRouter.routes.tsx          # THE route tree (lazy imports)
│   │       ├── desktopRouter.config.tsx          # thin re-export — do not add routes
│   │       └── desktopRouter.config.desktop.tsx  # thin re-export — do not add routes
│   ├── routes/                     # ✅ Thin route segments
│   ├── features/                   # ✅ Domain UI
│   ├── components/                 # ✅ Shared UI
│   ├── store/                      # ✅ Zustand
│   ├── hooks/                      # ✅ Client hooks
│   ├── services/                   # ✅ Client request builders
│   ├── styles/  config/  const/  types/  utils/  locales/   # ✅
│   ├── server/                     # ⛔ DO NOT TOUCH
│   ├── app/                        # ⛔ DO NOT TOUCH (Next.js backend)
│   └── instrumentation*.ts         # ⛔ DO NOT TOUCH
├── packages/
│   ├── database/                   # ⛔ DO NOT TOUCH
│   └── agent-runtime/              # ⛔ DO NOT TOUCH
├── docker-compose/  Dockerfile     # ⛔ DO NOT TOUCH
├── drizzle.config.ts               # ⛔ DO NOT TOUCH
├── next.config.ts                  # ⛔ DO NOT TOUCH
└── .agents/skills/                 # 👀 Auto-loaded skills
```

---

## 5. Development workflow

### Running the dev environment

```bash
# Frontend-only SPA dev (recommended for UI work)
# Vite dev server with HMR; proxies API to the remote/local backend.
bun run dev:spa
```

After `dev:spa` starts, the terminal prints a **Debug Proxy** URL like:

```
Debug Proxy: https://app.lobehub.com/_dangerous_local_dev_proxy?debug-host=http%3A%2F%2Flocalhost%3A9876
```

Open it to dogfood your local SPA against the production backend.

For desktop-shell work (Electron main/preload), follow `apps/desktop/Development.md`.

### Authenticated Electron QA sessions

When a task needs real logged-in desktop testing, prefer the already authenticated Electron renderer instead of a fresh browser profile.

- Relaunch Electron with the local-testing helper so the existing profile is preserved: `./.agents/skills/local-testing/scripts/electron-dev.sh restart`
- Attach agent-browser to the exposed CDP endpoint on `localhost:9222`
- Keep the existing Electron user data directory (`~/Library/Application Support/lobehub-desktop-dev`) so cookies and auth state survive the relaunch
- Use `window.__LOBE_STORES` in the renderer when you need to inspect live chat/agent state
- If the route loads before the chat store hydrates, reload the current agent page before continuing QA

### Package management

- `pnpm` for installing/updating dependencies.
- `bun` to run npm scripts (`bun run <script>`).
- `bunx` to run executable npm packages.

### Type checking

```bash
bun run type-check
```

### Testing

```bash
# Run a single test file (always quote the path)
bunx vitest run --silent='passed-only' '[file-path-pattern]'
```

- **Never** run `bun run test` — it executes the entire suite (\~10 min) and includes server tests we don't own.
- Prefer `vi.spyOn` over `vi.mock`.
- Tests must pass `bun run type-check`.
- After two failed fix attempts on a test, stop and ask.

### i18n

- Add new keys to `src/locales/default/<namespace>.ts`.
- For local preview, translate `locales/zh-CN/<namespace>.json` and/or `locales/en-US/<namespace>.json`.
- **Don't run `pnpm i18n`** — CI handles auto-translation.

---

## 6. SPA routes & features convention

We split routes from features:

- **`src/routes/`** holds _only_ page segments (`_layout/index.tsx`, `index.tsx`, `[id]/index.tsx`). Keep route files **thin** — they should import from `@/features/*` and compose. No business logic.
- **`src/features/`** holds business UI by **domain** (e.g. `Pages`, `PageEditor`, `Home`). Layout chunks, hooks, and domain UI go here. Each feature exports via `index.ts(x)`.
- Route files use `import { X } from '@/features/<Domain>'`. Do **not** create a `features/` folder inside `src/routes/`.

### 🚨 Desktop router structure

The route tree lives in **one** shared file: `src/spa/router/desktopRouter.routes.tsx` (lazy/code-split imports). Both `desktopRouter.config.tsx` and `desktopRouter.config.desktop.tsx` are thin re-exports of it and must stay that way — defining routes directly in either config file lets the web and desktop builds drift apart, which **causes blank screens**. `desktopRouter.sync.test.tsx` guards this. Make all route changes in `desktopRouter.routes.tsx`.

See `.agents/skills/spa-routes/SKILL.md` for the full convention.

---

## 7. Code style

- **TypeScript:** prefer `interface` over `type` for object shapes.
- **Styling:** prefer `createStaticStyles` + `cssVar.*` from `antd-style`. Fall back to `createStyles` + `token` only when runtime values are required.
- Only comment code that genuinely needs clarification.

---

## 8. Git workflow

- Branch from `canary`. PRs target `canary`.
- Use `git pull --rebase`.
- Branch naming: `feat/<short-name>`, `fix/<short-name>`, etc.
- Commit messages prefix with **gitmoji** (e.g. `:sparkles: add ...`, `:bug: fix ...`).
- Use `.github/PULL_REQUEST_TEMPLATE.md` for PR descriptions.
- **Never** run destructive Git commands (`git restore`, `git checkout --`, `git reset --hard`, etc.) against files with uncommitted local changes without explicit user confirmation.

---

## 9. Skills (auto-loaded)

Specialized guides live under `.agents/skills/` and are auto-loaded when relevant. Notable ones for this fork:

- `spa-routes`, `react`, `zustand`, `i18n`, `hotkey`, `modal`, `microcopy`, `typescript`, `testing`, `code-review`.

When reviewing code or diffs, **always** read `.agents/skills/code-review/SKILL.md` first.

Skills that target backend concerns (`trpc-router`, `drizzle`, `db-migrations`, `upstash-workflow`, etc.) are **not applicable** to work in this fork — if a task seems to need them, you're outside scope.

---

## 10. Decision checklist before editing

Before you change any file, confirm:

1. ☐ The file is under an **ALLOWED** path (Section 1).
2. ☐ The change is **client/UI** behavior, not server logic.
3. ☐ If touching SPA routes, both desktop router configs will be updated.
4. ☐ If adding i18n keys, the default locale and at least one preview locale are updated.
5. ☐ A targeted Vitest run (not the full suite) covers the change.

If any box is unchecked, stop and reconsider before proceeding.
