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
  colorPrimaryBg: string;
  colorPrimaryBgHover: string;
  colorPrimaryBorder: string;
  colorPrimaryBorderHover: string;
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

export const themePresets: Record<ThemePreset, ThemePresetDefinition> = {
  ember: {
    id: 'ember',
    neutralColor: 'sand',
    primaryColor: 'volcano',
    swatch: 'linear-gradient(135deg, #fff7ed 0%, #f97316 52%, #431407 100%)',
    tokens: {
      dark: {
        colorBgBase: '#120b08',
        colorBgContainer: '#1f130d',
        colorBgElevated: '#2b1a11',
        colorBgLayout: '#170d09',
        colorBorder: 'rgba(251, 146, 60, 0.28)',
        colorBorderSecondary: 'rgba(251, 146, 60, 0.16)',
        colorError: '#fb7185',
        colorFill: 'rgba(251, 146, 60, 0.18)',
        colorFillQuaternary: 'rgba(251, 146, 60, 0.07)',
        colorFillSecondary: 'rgba(251, 146, 60, 0.18)',
        colorFillTertiary: 'rgba(251, 146, 60, 0.11)',
        colorInfo: '#fbbf24',
        colorPrimary: '#f97316',
        colorPrimaryBg: 'rgba(249, 115, 22, 0.2)',
        colorPrimaryBgHover: 'rgba(249, 115, 22, 0.3)',
        colorPrimaryBorder: 'rgba(249, 115, 22, 0.42)',
        colorPrimaryBorderHover: 'rgba(249, 115, 22, 0.6)',
        colorSuccess: '#84cc16',
        colorText: '#fff7ed',
        colorTextDescription: 'rgba(255, 247, 237, 0.58)',
        colorTextQuaternary: 'rgba(255, 247, 237, 0.28)',
        colorTextSecondary: 'rgba(255, 247, 237, 0.72)',
        colorTextTertiary: 'rgba(255, 247, 237, 0.44)',
        colorWarning: '#f59e0b',
        controlItemBgActive: 'rgba(249, 115, 22, 0.2)',
        controlItemBgActiveHover: 'rgba(249, 115, 22, 0.3)',
        controlOutline: 'rgba(249, 115, 22, 0.36)',
      },
      light: {
        colorBgBase: '#fffbf7',
        colorBgContainer: '#fff7ed',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#fff4e8',
        colorBorder: 'rgba(194, 65, 12, 0.18)',
        colorBorderSecondary: 'rgba(194, 65, 12, 0.11)',
        colorError: '#dc2626',
        colorFill: 'rgba(249, 115, 22, 0.12)',
        colorFillQuaternary: 'rgba(249, 115, 22, 0.05)',
        colorFillSecondary: 'rgba(249, 115, 22, 0.12)',
        colorFillTertiary: 'rgba(249, 115, 22, 0.08)',
        colorInfo: '#d97706',
        colorPrimary: '#ea580c',
        colorPrimaryBg: 'rgba(234, 88, 12, 0.12)',
        colorPrimaryBgHover: 'rgba(234, 88, 12, 0.18)',
        colorPrimaryBorder: 'rgba(234, 88, 12, 0.28)',
        colorPrimaryBorderHover: 'rgba(234, 88, 12, 0.42)',
        colorSuccess: '#65a30d',
        colorText: '#2b170d',
        colorTextDescription: 'rgba(43, 23, 13, 0.5)',
        colorTextQuaternary: 'rgba(43, 23, 13, 0.24)',
        colorTextSecondary: 'rgba(43, 23, 13, 0.68)',
        colorTextTertiary: 'rgba(43, 23, 13, 0.42)',
        colorWarning: '#d97706',
        controlItemBgActive: 'rgba(234, 88, 12, 0.12)',
        controlItemBgActiveHover: 'rgba(234, 88, 12, 0.18)',
        controlOutline: 'rgba(234, 88, 12, 0.26)',
      },
    },
  },
  graphite: {
    id: 'graphite',
    neutralColor: 'slate',
    primaryColor: 'purple',
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #64748b 48%, #111827 100%)',
    tokens: {
      dark: {
        colorBgBase: '#0b0d12',
        colorBgContainer: '#141821',
        colorBgElevated: '#1d2430',
        colorBgLayout: '#0f1219',
        colorBorder: 'rgba(148, 163, 184, 0.26)',
        colorBorderSecondary: 'rgba(148, 163, 184, 0.14)',
        colorError: '#f87171',
        colorFill: 'rgba(148, 163, 184, 0.18)',
        colorFillQuaternary: 'rgba(148, 163, 184, 0.06)',
        colorFillSecondary: 'rgba(148, 163, 184, 0.18)',
        colorFillTertiary: 'rgba(148, 163, 184, 0.11)',
        colorInfo: '#a78bfa',
        colorPrimary: '#a78bfa',
        colorPrimaryBg: 'rgba(167, 139, 250, 0.2)',
        colorPrimaryBgHover: 'rgba(167, 139, 250, 0.3)',
        colorPrimaryBorder: 'rgba(167, 139, 250, 0.42)',
        colorPrimaryBorderHover: 'rgba(167, 139, 250, 0.58)',
        colorSuccess: '#34d399',
        colorText: '#f8fafc',
        colorTextDescription: 'rgba(248, 250, 252, 0.56)',
        colorTextQuaternary: 'rgba(248, 250, 252, 0.26)',
        colorTextSecondary: 'rgba(248, 250, 252, 0.72)',
        colorTextTertiary: 'rgba(248, 250, 252, 0.42)',
        colorWarning: '#fbbf24',
        controlItemBgActive: 'rgba(167, 139, 250, 0.2)',
        controlItemBgActiveHover: 'rgba(167, 139, 250, 0.3)',
        controlOutline: 'rgba(167, 139, 250, 0.34)',
      },
      light: {
        colorBgBase: '#ffffff',
        colorBgContainer: '#f8fafc',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f1f5f9',
        colorBorder: 'rgba(71, 85, 105, 0.18)',
        colorBorderSecondary: 'rgba(71, 85, 105, 0.1)',
        colorError: '#dc2626',
        colorFill: 'rgba(100, 116, 139, 0.12)',
        colorFillQuaternary: 'rgba(100, 116, 139, 0.05)',
        colorFillSecondary: 'rgba(100, 116, 139, 0.12)',
        colorFillTertiary: 'rgba(100, 116, 139, 0.08)',
        colorInfo: '#7c3aed',
        colorPrimary: '#7c3aed',
        colorPrimaryBg: 'rgba(124, 58, 237, 0.1)',
        colorPrimaryBgHover: 'rgba(124, 58, 237, 0.16)',
        colorPrimaryBorder: 'rgba(124, 58, 237, 0.26)',
        colorPrimaryBorderHover: 'rgba(124, 58, 237, 0.4)',
        colorSuccess: '#059669',
        colorText: '#111827',
        colorTextDescription: 'rgba(17, 24, 39, 0.5)',
        colorTextQuaternary: 'rgba(17, 24, 39, 0.22)',
        colorTextSecondary: 'rgba(17, 24, 39, 0.68)',
        colorTextTertiary: 'rgba(17, 24, 39, 0.4)',
        colorWarning: '#d97706',
        controlItemBgActive: 'rgba(124, 58, 237, 0.11)',
        controlItemBgActiveHover: 'rgba(124, 58, 237, 0.17)',
        controlOutline: 'rgba(124, 58, 237, 0.24)',
      },
    },
  },
  ocean: {
    id: 'ocean',
    neutralColor: 'sage',
    primaryColor: 'blue',
    swatch: 'linear-gradient(135deg, #ecfeff 0%, #2563eb 50%, #082f49 100%)',
    tokens: {
      dark: {
        colorBgBase: '#06111f',
        colorBgContainer: '#0b1b2e',
        colorBgElevated: '#10263d',
        colorBgLayout: '#081624',
        colorBorder: 'rgba(56, 189, 248, 0.26)',
        colorBorderSecondary: 'rgba(56, 189, 248, 0.14)',
        colorError: '#fb7185',
        colorFill: 'rgba(56, 189, 248, 0.18)',
        colorFillQuaternary: 'rgba(56, 189, 248, 0.06)',
        colorFillSecondary: 'rgba(56, 189, 248, 0.17)',
        colorFillTertiary: 'rgba(56, 189, 248, 0.1)',
        colorInfo: '#38bdf8',
        colorPrimary: '#38bdf8',
        colorPrimaryBg: 'rgba(56, 189, 248, 0.2)',
        colorPrimaryBgHover: 'rgba(56, 189, 248, 0.3)',
        colorPrimaryBorder: 'rgba(56, 189, 248, 0.42)',
        colorPrimaryBorderHover: 'rgba(56, 189, 248, 0.6)',
        colorSuccess: '#2dd4bf',
        colorText: '#ecfeff',
        colorTextDescription: 'rgba(236, 254, 255, 0.56)',
        colorTextQuaternary: 'rgba(236, 254, 255, 0.26)',
        colorTextSecondary: 'rgba(236, 254, 255, 0.72)',
        colorTextTertiary: 'rgba(236, 254, 255, 0.42)',
        colorWarning: '#facc15',
        controlItemBgActive: 'rgba(56, 189, 248, 0.2)',
        controlItemBgActiveHover: 'rgba(56, 189, 248, 0.3)',
        controlOutline: 'rgba(56, 189, 248, 0.34)',
      },
      light: {
        colorBgBase: '#fbfeff',
        colorBgContainer: '#f0f9ff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#eaf7ff',
        colorBorder: 'rgba(14, 116, 144, 0.18)',
        colorBorderSecondary: 'rgba(14, 116, 144, 0.1)',
        colorError: '#dc2626',
        colorFill: 'rgba(14, 165, 233, 0.12)',
        colorFillQuaternary: 'rgba(14, 165, 233, 0.05)',
        colorFillSecondary: 'rgba(14, 165, 233, 0.12)',
        colorFillTertiary: 'rgba(14, 165, 233, 0.08)',
        colorInfo: '#0284c7',
        colorPrimary: '#0284c7',
        colorPrimaryBg: 'rgba(2, 132, 199, 0.11)',
        colorPrimaryBgHover: 'rgba(2, 132, 199, 0.17)',
        colorPrimaryBorder: 'rgba(2, 132, 199, 0.28)',
        colorPrimaryBorderHover: 'rgba(2, 132, 199, 0.42)',
        colorSuccess: '#0f766e',
        colorText: '#0c2238',
        colorTextDescription: 'rgba(12, 34, 56, 0.5)',
        colorTextQuaternary: 'rgba(12, 34, 56, 0.23)',
        colorTextSecondary: 'rgba(12, 34, 56, 0.68)',
        colorTextTertiary: 'rgba(12, 34, 56, 0.4)',
        colorWarning: '#ca8a04',
        controlItemBgActive: 'rgba(2, 132, 199, 0.11)',
        controlItemBgActiveHover: 'rgba(2, 132, 199, 0.17)',
        controlOutline: 'rgba(2, 132, 199, 0.24)',
      },
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
