import type { HighlighterProps, MermaidProps, NeutralColors, PrimaryColors } from '@lobehub/ui';

import type { ResponseAnimationStyle } from '../../aiProvider';

export type AnimationMode = 'disabled' | 'agile' | 'elegant';

export type ContextMenuMode = 'disabled' | 'default';

export type ThemePreset =
  | 'graphite'
  | 'slate'
  | 'zinc'
  | 'stone'
  | 'ivory'
  | 'ocean'
  | 'forest'
  | 'ember';

export interface UserGeneralConfig {
  animationMode?: AnimationMode;
  contextMenuMode?: ContextMenuMode;
  /**
   * Whether to auto-scroll during AI streaming output
   * @default true
   */
  enableAutoScrollOnStreaming?: boolean;
  fontSize: number;
  highlighterTheme?: HighlighterProps['theme'];
  isDevMode: boolean;
  isLiteMode: boolean;
  mermaidTheme?: MermaidProps['theme'];
  neutralColor?: NeutralColors;
  primaryColor?: PrimaryColors;
  responseLanguage?: string;
  telemetry: boolean;
  themePreset?: ThemePreset;
  timezone?: string;
  transitionMode?: ResponseAnimationStyle;
}
