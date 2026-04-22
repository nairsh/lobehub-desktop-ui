export const STORAGE_KEY = 'MODEL_SWITCH_PANEL_WIDTH';
export const STORAGE_KEY_MODE = 'MODEL_SWITCH_PANEL_MODE';
export const DEFAULT_WIDTH = 300;
export const MIN_WIDTH = 240;
export const MAX_WIDTH = 500;
export const MAX_PANEL_HEIGHT = 400;
export const TOOLBAR_HEIGHT = 40;
export const FOOTER_HEIGHT = 80;

export const ITEM_HEIGHT = {
  'empty-model': 32,
  'group-header': 32,
  'model-item': 32,
  'no-provider': 32,
} as const;

export const ENABLE_RESIZING = {
  bottom: false,
  bottomLeft: false,
  bottomRight: false,
  left: false,
  right: true,
  top: false,
  topLeft: false,
  topRight: false,
} as const;
