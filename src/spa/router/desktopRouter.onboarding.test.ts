import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('desktopRouter onboarding routes', () => {
  it('uses the desktop onboarding route and redirects onboarding aliases to it', async () => {
    const source = await readFile(
      path.join(process.cwd(), 'src/spa/router/desktopRouter.routes.tsx'),
      'utf8',
    );

    expect(source).toContain("import('@/routes/(desktop)/desktop-onboarding')");
    expect(source).toContain("path: '/desktop-onboarding'");
    expect(source).toContain("redirectElement('/desktop-onboarding')");
    expect(source).toContain("path: '/onboarding'");
    expect(source).toContain("path: '/onboarding/agent'");
    expect(source).toContain("path: '/onboarding/classic'");
  });
});
