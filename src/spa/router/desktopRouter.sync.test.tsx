import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SHARED_ROUTES_REEXPORT = "export { desktopRoutes } from './desktopRouter.routes';";

describe('desktopRouter config sync', () => {
  // Both router configs must stay thin re-exports of the single shared route
  // tree in desktopRouter.routes.tsx. If either file starts defining its own
  // routes again, the desktop and web builds can drift apart, which causes
  // blank screens on routes that only exist in one tree.
  it('both desktop router configs re-export the shared route tree', async () => {
    const [asyncSource, desktopSource] = await Promise.all([
      readFile(path.join(process.cwd(), 'src/spa/router/desktopRouter.config.tsx'), 'utf8'),
      readFile(path.join(process.cwd(), 'src/spa/router/desktopRouter.config.desktop.tsx'), 'utf8'),
    ]);

    expect(asyncSource).toContain(SHARED_ROUTES_REEXPORT);
    expect(desktopSource).toContain(SHARED_ROUTES_REEXPORT);

    // Neither file may define routes of its own
    expect(asyncSource).not.toContain('RouteObject');
    expect(desktopSource).not.toContain('RouteObject');
  });
});
