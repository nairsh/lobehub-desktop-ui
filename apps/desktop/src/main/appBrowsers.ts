import { APP_WINDOW_MIN_SIZE } from '@lobechat/desktop-bridge';

import type { BrowserWindowOpts } from './core/browser/Browser';

export const BrowsersIdentifiers = {
  app: 'app',
  devtools: 'devtools',
  floatingChat: 'floatingChat',
};

export const appBrowsers = {
  app: {
    autoHideMenuBar: true,
    height: 800,
    identifier: 'app',
    keepAlive: true,
    minHeight: APP_WINDOW_MIN_SIZE.height,
    minWidth: APP_WINDOW_MIN_SIZE.width,
    path: '/',
    showOnInit: true,
    titleBarStyle: 'hidden',
    width: 1200,
  },
  devtools: {
    autoHideMenuBar: true,
    fullscreenable: false,
    height: 600,
    identifier: 'devtools',
    maximizable: false,
    minWidth: 400,
    parentIdentifier: 'app',
    path: '/desktop/devtools',
    titleBarStyle: 'hiddenInset',
    width: 1000,
  },
  floatingChat: {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    fullscreenable: false,
    // Opens as a compact "pill" (just the input bar); the renderer grows the
    // window to its full height once the first message is sent.
    height: 76,
    identifier: 'floatingChat',
    // Keep the window alive across close/hide so reopening is instant (no full
    // SPA reload). The main process resets the window size to pill on each open;
    // the renderer resets state via the openFloatingChat broadcast freshOpen flag.
    keepAlive: true,
    maximizable: false,
    minHeight: 76,
    minWidth: 360,
    path: '/floating-chat',
    resizable: true,
    // Always reopen as the compact pill, never at a previous session's grown size.
    resetSizeOnOpen: true,
    showOnInit: false,
    skipTaskbar: true,
    title: 'Floating Chat',
    // No titleBarStyle: with frame:false this keeps the window fully frameless
    // (no macOS traffic-light buttons) so it can render as a clean pill.
    width: 560,
  },
} satisfies Record<string, BrowserWindowOpts>;

// Window templates for multi-instance windows
export interface WindowTemplate {
  allowMultipleInstances: boolean;
  autoHideMenuBar?: boolean;
  baseIdentifier: string;
  basePath: string;
  devTools?: boolean;
  height?: number;
  keepAlive?: boolean;
  minWidth?: number;
  parentIdentifier?: string;
  showOnInit?: boolean;
  title?: string;
  titleBarStyle?: 'hidden' | 'default' | 'hiddenInset' | 'customButtonsOnHover';
  // Note: vibrancy / visualEffectState / transparent are intentionally omitted.
  // Platform visual effects are managed exclusively by WindowThemeManager.
  width?: number;
}

export const windowTemplates = {
  chatSingle: {
    allowMultipleInstances: true,
    autoHideMenuBar: true,
    baseIdentifier: 'chatSingle',
    basePath: '/agent',
    height: 600,
    keepAlive: false, // Multi-instance windows don't need to stay alive
    minWidth: 400,
    parentIdentifier: 'app',
    titleBarStyle: 'hidden',
    width: 900,
  },
} satisfies Record<string, WindowTemplate>;

export type AppBrowsersIdentifiers = keyof typeof appBrowsers;
export type WindowTemplateIdentifiers = keyof typeof windowTemplates;
