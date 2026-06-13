import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { PluginOption, ViteDevServer } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import {
  sharedOptimizeDeps,
  sharedRendererDefine,
  sharedRendererPlugins,
} from '../../plugins/vite/sharedRendererConfig';

/**
 * Rewrite all SPA navigation requests to `/apps/desktop/index.html` so the
 * standalone renderer dev server serves the desktop entry for any app route.
 */
function electronDesktopHtmlPlugin(): PluginOption {
  return {
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        const pathname = url.split('?')[0];
        const isViteInternal = pathname.startsWith('/@') || pathname.startsWith('/node_modules/');
        const isAsset = /\.\w+$/.test(pathname);

        if (!isViteInternal && !isAsset) {
          req.url = '/apps/desktop/index.html';
        }

        next();
      });
    },
    name: 'electron-desktop-html',
  };
}

const ROOT_DIR = resolve(__dirname, '../..');
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

Object.assign(process.env, loadEnv(mode, ROOT_DIR, ''));

const desktopPackageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig({
  root: ROOT_DIR,
  define: {
    ...sharedRendererDefine({ isMobile: false, isElectron: true }),
    __MAIN_VERSION__: JSON.stringify(desktopPackageJson.version),
  },
  optimizeDeps: sharedOptimizeDeps,
  plugins: [
    electronDesktopHtmlPlugin(),
    ...(sharedRendererPlugins({ platform: 'desktop' }) as PluginOption[]),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PLAYWRIGHT_SPA_PORT ?? 9876),
    strictPort: true,
  },
});
