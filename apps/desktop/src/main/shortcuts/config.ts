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

/**
 * Default shortcut configuration
 */
export const DEFAULT_SHORTCUTS_CONFIG: Record<ShortcutActionType, string> = {
  [ShortcutActionEnum.openSettings]: 'CommandOrControl+,',
  [ShortcutActionEnum.openFloatingChat]: 'CommandOrControl+Shift+K',
  [ShortcutActionEnum.showApp]: 'Control+E',
};
