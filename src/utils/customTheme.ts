import type { ThemePreset } from '@lobechat/types';
import type { NeutralColors, PrimaryColors } from '@lobehub/ui';
import { neutralColors, primaryColors } from '@lobehub/ui';
import chroma from 'chroma-js';

interface ThemePresetTokenSet {
  colorBgBase: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorBgLayout: string;
  colorBorder: string;
  colorBorderSecondary: string;
  colorError: string;
  colorFill: string;
  colorFillQuaternary: string;
  colorFillSecondary: string;
  colorFillTertiary: string;
  colorInfo: string;
  colorPrimary: string;
  colorPrimaryActive?: string;
  colorPrimaryBg: string;
  colorPrimaryBgHover: string;
  colorPrimaryBorder: string;
  colorPrimaryBorderHover: string;
  colorPrimaryHover?: string;
  colorPrimaryText?: string;
  colorPrimaryTextActive?: string;
  colorPrimaryTextHover?: string;
  colorSuccess: string;
  colorText: string;
  colorTextDescription: string;
  colorTextQuaternary: string;
  colorTextSecondary: string;
  colorTextTertiary: string;
  colorWarning: string;
  controlItemBgActive: string;
  controlItemBgActiveHover: string;
  controlOutline: string;
}

interface ThemePresetDefinition {
  id: ThemePreset;
  neutralColor: NeutralColors;
  primaryColor: PrimaryColors;
  swatch: string;
  tokens: {
    dark: ThemePresetTokenSet;
    light: ThemePresetTokenSet;
  };
}

interface ThemePresetTokenOptions {
  accent: string;
  background: string;
  container: string;
  descriptionText: string;
  elevated: string;
  error: string;
  info?: string;
  isDarkMode: boolean;
  layout: string;
  neutral: string;
  primaryBg: string;
  primaryBgHover: string;
  secondaryText: string;
  success: string;
  tertiaryText: string;
  text: string;
  warning: string;
}

const createAlphaColor = (color: string, alpha: number) => chroma(color).alpha(alpha).css();

const createEdgeColor = (color: string, amount: number) => {
  const scale =
    amount >= 0 ? chroma(color).brighten(amount) : chroma(color).darken(Math.abs(amount));

  return scale.hex();
};

export const createThemeSwatchBackground = (color: string) =>
  `linear-gradient(135deg, ${createEdgeColor(color, 1.2)} 0%, ${color} 52%, ${createEdgeColor(color, -1.1)} 100%)`;

// Neutral colors are inherently low-saturation (~2-4% HSL saturation).
// Boost saturation so each hue family is clearly visible in small swatches.
export const createNeutralSwatchBackground = (color: string) => {
  // Boost saturation to 20% so hue families are distinguishable (actual saturation is ~2-4%)
  const vivid = chroma(color).set('hsl.s', 0.2).hex();
  return createThemeSwatchBackground(vivid);
};

export const defaultThemeSwatchBackground =
  'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0 45%, rgba(0, 0, 0, 0.06) 45% 55%, rgba(255, 255, 255, 0.94) 55% 100%)';

export const resolvePrimaryThemeColor = (value?: PrimaryColors) =>
  value ? primaryColors[value] : undefined;

export const resolveNeutralThemeColor = (value?: NeutralColors) => {
  if (!value) return undefined;
  const baseColor = neutralColors[value];
  // Radix neutral palettes ship with ~2-4% HSL saturation, which makes
  // mauve/olive/sage/sand/slate visually indistinguishable. Boost to ~35%
  // so each hue family is clearly and noticeably distinct in the resolved theme.
  return chroma(baseColor).set('hsl.s', 0.35).hex();
};

const createPresetTokenSet = ({
  accent,
  background,
  container,
  descriptionText,
  elevated,
  error,
  info,
  isDarkMode,
  layout,
  neutral,
  primaryBg,
  primaryBgHover,
  secondaryText,
  success,
  text,
  tertiaryText,
  warning,
}: ThemePresetTokenOptions): ThemePresetTokenSet => ({
  colorBgBase: background,
  colorBgContainer: container,
  colorBgElevated: elevated,
  colorBgLayout: layout,
  colorBorder: createAlphaColor(neutral, isDarkMode ? 0.24 : 0.16),
  colorBorderSecondary: createAlphaColor(neutral, isDarkMode ? 0.14 : 0.1),
  colorError: error,
  colorFill: createAlphaColor(neutral, isDarkMode ? 0.16 : 0.1),
  colorFillQuaternary: createAlphaColor(neutral, isDarkMode ? 0.04 : 0.035),
  colorFillSecondary: createAlphaColor(neutral, isDarkMode ? 0.12 : 0.08),
  colorFillTertiary: createAlphaColor(neutral, isDarkMode ? 0.08 : 0.055),
  colorInfo: info ?? accent,
  colorPrimary: accent,
  colorPrimaryBg: primaryBg,
  colorPrimaryBgHover: primaryBgHover,
  colorPrimaryBorder: createAlphaColor(accent, isDarkMode ? 0.34 : 0.24),
  colorPrimaryBorderHover: createAlphaColor(accent, isDarkMode ? 0.46 : 0.34),
  colorSuccess: success,
  colorText: text,
  colorTextDescription: descriptionText,
  colorTextQuaternary: createAlphaColor(text, isDarkMode ? 0.24 : 0.22),
  colorTextSecondary: secondaryText,
  colorTextTertiary: tertiaryText,
  colorWarning: warning,
  controlItemBgActive: primaryBg,
  controlItemBgActiveHover: primaryBgHover,
  controlOutline: createAlphaColor(accent, isDarkMode ? 0.28 : 0.22),
});

export const themePresets: Record<ThemePreset, ThemePresetDefinition> = {
  graphite: {
    id: 'graphite',
    neutralColor: 'slate',
    primaryColor: 'purple',
    swatch: '#64748b',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#a78bfa',
        background: '#0d1117',
        container: '#151b23',
        descriptionText: 'rgba(248, 250, 252, 0.56)',
        elevated: '#1b2430',
        error: '#f87171',
        isDarkMode: true,
        layout: '#111820',
        neutral: '#94a3b8',
        primaryBg: 'rgba(167, 139, 250, 0.14)',
        primaryBgHover: 'rgba(167, 139, 250, 0.2)',
        secondaryText: 'rgba(248, 250, 252, 0.72)',
        success: '#34d399',
        tertiaryText: 'rgba(248, 250, 252, 0.42)',
        text: '#f8fafc',
        warning: '#fbbf24',
      }),
      light: createPresetTokenSet({
        accent: '#7c3aed',
        background: '#ffffff',
        container: '#fbfcfe',
        descriptionText: 'rgba(17, 24, 39, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#f4f6f8',
        neutral: '#64748b',
        primaryBg: 'rgba(124, 58, 237, 0.08)',
        primaryBgHover: 'rgba(124, 58, 237, 0.13)',
        secondaryText: 'rgba(17, 24, 39, 0.68)',
        success: '#059669',
        tertiaryText: 'rgba(17, 24, 39, 0.4)',
        text: '#111827',
        warning: '#d97706',
      }),
    },
  },
  slate: {
    id: 'slate',
    neutralColor: 'slate',
    primaryColor: 'blue',
    swatch: '#94a3b8',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#60a5fa',
        background: '#0f172a',
        container: '#172033',
        descriptionText: 'rgba(241, 245, 249, 0.56)',
        elevated: '#1e293b',
        error: '#fb7185',
        isDarkMode: true,
        layout: '#111827',
        neutral: '#94a3b8',
        primaryBg: 'rgba(96, 165, 250, 0.13)',
        primaryBgHover: 'rgba(96, 165, 250, 0.19)',
        secondaryText: 'rgba(241, 245, 249, 0.72)',
        success: '#34d399',
        tertiaryText: 'rgba(241, 245, 249, 0.42)',
        text: '#f1f5f9',
        warning: '#fbbf24',
      }),
      light: createPresetTokenSet({
        accent: '#2563eb',
        background: '#ffffff',
        container: '#ffffff',
        descriptionText: 'rgba(15, 23, 42, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#f1f5f9',
        neutral: '#64748b',
        primaryBg: 'rgba(37, 99, 235, 0.075)',
        primaryBgHover: 'rgba(37, 99, 235, 0.12)',
        secondaryText: 'rgba(15, 23, 42, 0.68)',
        success: '#059669',
        tertiaryText: 'rgba(15, 23, 42, 0.4)',
        text: '#0f172a',
        warning: '#d97706',
      }),
    },
  },
  zinc: {
    id: 'zinc',
    neutralColor: 'mauve',
    primaryColor: 'geekblue',
    swatch: '#a1a1aa',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#818cf8',
        background: '#111113',
        container: '#1a1a1d',
        descriptionText: 'rgba(244, 244, 245, 0.56)',
        elevated: '#242428',
        error: '#f87171',
        isDarkMode: true,
        layout: '#151517',
        neutral: '#a1a1aa',
        primaryBg: 'rgba(129, 140, 248, 0.13)',
        primaryBgHover: 'rgba(129, 140, 248, 0.19)',
        secondaryText: 'rgba(244, 244, 245, 0.72)',
        success: '#4ade80',
        tertiaryText: 'rgba(244, 244, 245, 0.42)',
        text: '#f4f4f5',
        warning: '#facc15',
      }),
      light: createPresetTokenSet({
        accent: '#4f46e5',
        background: '#ffffff',
        container: '#ffffff',
        descriptionText: 'rgba(24, 24, 27, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#f4f4f5',
        neutral: '#71717a',
        primaryBg: 'rgba(79, 70, 229, 0.075)',
        primaryBgHover: 'rgba(79, 70, 229, 0.12)',
        secondaryText: 'rgba(24, 24, 27, 0.68)',
        success: '#16a34a',
        tertiaryText: 'rgba(24, 24, 27, 0.4)',
        text: '#18181b',
        warning: '#ca8a04',
      }),
    },
  },
  stone: {
    id: 'stone',
    neutralColor: 'sand',
    primaryColor: 'orange',
    swatch: '#a8a29e',
    tokens: {
      dark: {
        ...createPresetTokenSet({
          accent: '#57534e',
          background: '#11100e',
          container: '#1c1917',
          descriptionText: 'rgba(250, 250, 249, 0.56)',
          elevated: '#292524',
          error: '#f87171',
          info: '#60a5fa',
          isDarkMode: true,
          layout: '#171412',
          neutral: '#a8a29e',
          primaryBg: 'rgba(168, 162, 158, 0.14)',
          primaryBgHover: 'rgba(168, 162, 158, 0.2)',
          secondaryText: 'rgba(250, 250, 249, 0.72)',
          success: '#4ade80',
          tertiaryText: 'rgba(250, 250, 249, 0.42)',
          text: '#fafaf9',
          warning: '#fbbf24',
        }),
        colorPrimaryActive: '#44403c',
        colorPrimaryHover: '#78716c',
        colorPrimaryText: '#d6d3d1',
        colorPrimaryTextActive: '#a8a29e',
        colorPrimaryTextHover: '#e7e5e4',
      },
      light: {
        ...createPresetTokenSet({
          accent: '#1c1917',
          background: '#fffefd',
          container: '#ffffff',
          descriptionText: 'rgba(41, 37, 36, 0.5)',
          elevated: '#ffffff',
          error: '#dc2626',
          info: '#2563eb',
          isDarkMode: false,
          layout: '#f5f3f0',
          neutral: '#78716c',
          primaryBg: 'rgba(28, 25, 23, 0.06)',
          primaryBgHover: 'rgba(28, 25, 23, 0.1)',
          secondaryText: 'rgba(41, 37, 36, 0.68)',
          success: '#16a34a',
          tertiaryText: 'rgba(41, 37, 36, 0.4)',
          text: '#292524',
          warning: '#d97706',
        }),
        colorPrimaryActive: '#0c0a09',
        colorPrimaryHover: '#292524',
        colorPrimaryText: '#1c1917',
        colorPrimaryTextActive: '#0c0a09',
        colorPrimaryTextHover: '#292524',
      },
    },
  },
  ivory: {
    id: 'ivory',
    neutralColor: 'sand',
    primaryColor: 'gold',
    swatch: '#e7dcc7',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#fbbf24',
        background: '#17130c',
        container: '#211b11',
        descriptionText: 'rgba(255, 251, 235, 0.56)',
        elevated: '#2b2418',
        error: '#fb7185',
        isDarkMode: true,
        layout: '#1b160f',
        neutral: '#b8a98d',
        primaryBg: 'rgba(251, 191, 36, 0.11)',
        primaryBgHover: 'rgba(251, 191, 36, 0.17)',
        secondaryText: 'rgba(255, 251, 235, 0.72)',
        success: '#84cc16',
        tertiaryText: 'rgba(255, 251, 235, 0.42)',
        text: '#fffbeb',
        warning: '#f59e0b',
      }),
      light: createPresetTokenSet({
        accent: '#b45309',
        background: '#fffdf7',
        container: '#fffefa',
        descriptionText: 'rgba(47, 37, 20, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#f8f2e6',
        neutral: '#9a8a6e',
        primaryBg: 'rgba(180, 83, 9, 0.07)',
        primaryBgHover: 'rgba(180, 83, 9, 0.11)',
        secondaryText: 'rgba(47, 37, 20, 0.68)',
        success: '#4d7c0f',
        tertiaryText: 'rgba(47, 37, 20, 0.4)',
        text: '#2f2514',
        warning: '#b45309',
      }),
    },
  },
  ocean: {
    id: 'ocean',
    neutralColor: 'sage',
    primaryColor: 'blue',
    swatch: '#38bdf8',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#38bdf8',
        background: '#07131f',
        container: '#0d1b2a',
        descriptionText: 'rgba(236, 254, 255, 0.56)',
        elevated: '#13263a',
        error: '#fb7185',
        isDarkMode: true,
        layout: '#0a1724',
        neutral: '#7dd3fc',
        primaryBg: 'rgba(56, 189, 248, 0.13)',
        primaryBgHover: 'rgba(56, 189, 248, 0.19)',
        secondaryText: 'rgba(236, 254, 255, 0.72)',
        success: '#2dd4bf',
        tertiaryText: 'rgba(236, 254, 255, 0.42)',
        text: '#ecfeff',
        warning: '#facc15',
      }),
      light: createPresetTokenSet({
        accent: '#0284c7',
        background: '#fbfeff',
        container: '#ffffff',
        descriptionText: 'rgba(12, 34, 56, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#eef8ff',
        neutral: '#0ea5e9',
        primaryBg: 'rgba(2, 132, 199, 0.075)',
        primaryBgHover: 'rgba(2, 132, 199, 0.12)',
        secondaryText: 'rgba(12, 34, 56, 0.68)',
        success: '#0f766e',
        tertiaryText: 'rgba(12, 34, 56, 0.4)',
        text: '#0c2238',
        warning: '#ca8a04',
      }),
    },
  },
  forest: {
    id: 'forest',
    neutralColor: 'sage',
    primaryColor: 'green',
    swatch: '#4ade80',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#4ade80',
        background: '#08140d',
        container: '#101d14',
        descriptionText: 'rgba(240, 253, 244, 0.56)',
        elevated: '#18271c',
        error: '#fb7185',
        isDarkMode: true,
        layout: '#0c1810',
        neutral: '#86efac',
        primaryBg: 'rgba(74, 222, 128, 0.12)',
        primaryBgHover: 'rgba(74, 222, 128, 0.18)',
        secondaryText: 'rgba(240, 253, 244, 0.72)',
        success: '#4ade80',
        tertiaryText: 'rgba(240, 253, 244, 0.42)',
        text: '#f0fdf4',
        warning: '#facc15',
      }),
      light: createPresetTokenSet({
        accent: '#16a34a',
        background: '#fbfefc',
        container: '#ffffff',
        descriptionText: 'rgba(20, 45, 27, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#eff7f1',
        neutral: '#22c55e',
        primaryBg: 'rgba(22, 163, 74, 0.075)',
        primaryBgHover: 'rgba(22, 163, 74, 0.12)',
        secondaryText: 'rgba(20, 45, 27, 0.68)',
        success: '#15803d',
        tertiaryText: 'rgba(20, 45, 27, 0.4)',
        text: '#142d1b',
        warning: '#ca8a04',
      }),
    },
  },
  ember: {
    id: 'ember',
    neutralColor: 'sand',
    primaryColor: 'volcano',
    swatch: '#f97316',
    tokens: {
      dark: createPresetTokenSet({
        accent: '#f97316',
        background: '#160d08',
        container: '#21150f',
        descriptionText: 'rgba(255, 247, 237, 0.56)',
        elevated: '#2b1d14',
        error: '#fb7185',
        isDarkMode: true,
        layout: '#1a100b',
        neutral: '#fdba74',
        primaryBg: 'rgba(249, 115, 22, 0.12)',
        primaryBgHover: 'rgba(249, 115, 22, 0.18)',
        secondaryText: 'rgba(255, 247, 237, 0.72)',
        success: '#84cc16',
        tertiaryText: 'rgba(255, 247, 237, 0.42)',
        text: '#fff7ed',
        warning: '#f59e0b',
      }),
      light: createPresetTokenSet({
        accent: '#ea580c',
        background: '#fffdfb',
        container: '#ffffff',
        descriptionText: 'rgba(43, 23, 13, 0.5)',
        elevated: '#ffffff',
        error: '#dc2626',
        isDarkMode: false,
        layout: '#fbf3eb',
        neutral: '#f97316',
        primaryBg: 'rgba(234, 88, 12, 0.075)',
        primaryBgHover: 'rgba(234, 88, 12, 0.12)',
        secondaryText: 'rgba(43, 23, 13, 0.68)',
        success: '#65a30d',
        tertiaryText: 'rgba(43, 23, 13, 0.4)',
        text: '#2b170d',
        warning: '#d97706',
      }),
    },
  },
};

export const themePresetIds = Object.keys(themePresets) as ThemePreset[];

export const getThemePreset = (preset?: string): ThemePresetDefinition | undefined => {
  if (!preset || !Object.prototype.hasOwnProperty.call(themePresets, preset)) return undefined;

  return themePresets[preset as ThemePreset];
};

export const createPresetSwatchBackground = (preset: ThemePreset): string => {
  return themePresets[preset]?.swatch ?? defaultThemeSwatchBackground;
};

export const createEnhancedThemeTokens = ({
  isDarkMode,
  neutralColor,
  primaryColor,
  themePreset,
}: {
  isDarkMode: boolean;
  neutralColor?: NeutralColors;
  primaryColor?: PrimaryColors;
  themePreset?: ThemePreset | '';
}): Partial<ThemePresetTokenSet> => {
  const resolvedPrimary = resolvePrimaryThemeColor(primaryColor);
  const resolvedNeutral = resolveNeutralThemeColor(neutralColor);
  const preset = getThemePreset(themePreset);

  if (preset) return preset.tokens[isDarkMode ? 'dark' : 'light'];

  return {
    ...(resolvedNeutral && {
      colorBorderSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.3 : 0.18),
      colorFillQuaternary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.14 : 0.06),
      colorFillSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.26 : 0.12),
      colorFillTertiary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.2 : 0.09),
    }),
    ...(resolvedPrimary && {
      colorPrimaryBg: createAlphaColor(resolvedPrimary, isDarkMode ? 0.4 : 0.2),
      colorPrimaryBgHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.48 : 0.27),
      colorPrimaryBorder: createAlphaColor(resolvedPrimary, isDarkMode ? 0.54 : 0.34),
      colorPrimaryBorderHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.68 : 0.46),
      controlItemBgActive: createAlphaColor(resolvedPrimary, isDarkMode ? 0.32 : 0.16),
      controlItemBgActiveHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.4 : 0.22),
      controlOutline: createAlphaColor(resolvedPrimary, isDarkMode ? 0.5 : 0.28),
    }),
  };
};
