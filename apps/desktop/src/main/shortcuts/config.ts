/**
 * Shortcut action type enum
 */
export const ShortcutActionEnum = {
  openSettings: 'openSettings',
  openFloatingChat: 'openFloatingChat',
  /**
   * Show/hide main window
   */
  showApp: 'showApp',
} as const;

export type ShortcutActionType = (typeof ShortcutActionEnum)[keyof typeof ShortcutActionEnum];

export const LEGACY_FLOATING_CHAT_SHORTCUT = 'CommandOrControl+Shift+K';
export const FALLBACK_FLOATING_CHAT_SHORTCUT = 'Control+Alt+K';

/**
 * Default shortcut configuration
 */
export const DEFAULT_SHORTCUTS_CONFIG: Record<ShortcutActionType, string> = {
  [ShortcutActionEnum.openSettings]: 'CommandOrControl+,',
  [ShortcutActionEnum.openFloatingChat]: 'CommandOrControl+K',
  [ShortcutActionEnum.showApp]: 'Control+E',
};
