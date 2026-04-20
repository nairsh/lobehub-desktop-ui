import type { ThemePreset } from '@lobechat/types';
import type { NeutralColors, PrimaryColors } from '@lobehub/ui';
import { neutralColors, primaryColors } from '@lobehub/ui';
import chroma from 'chroma-js';

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

// Perplexity preset: near-black navy base with teal accent
const PERPLEXITY_BG_BASE = '#0c0e14';
const PERPLEXITY_PRIMARY = '#20b2aa'; // teal

export const createPresetSwatchBackground = (preset: ThemePreset): string => {
  if (preset === 'perplexity') {
    return `linear-gradient(135deg, ${PERPLEXITY_BG_BASE} 0%, #161a26 50%, ${PERPLEXITY_PRIMARY} 100%)`;
  }
  return defaultThemeSwatchBackground;
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
  themePreset?: ThemePreset;
}) => {
  const resolvedPrimary = resolvePrimaryThemeColor(primaryColor);
  const resolvedNeutral = resolveNeutralThemeColor(neutralColor);

  // Perplexity preset: very dark blue-black backgrounds + teal highlights
  const presetTokens =
    themePreset === 'perplexity' && isDarkMode
      ? {
          colorBgBase: PERPLEXITY_BG_BASE,
          colorBgContainer: '#131622',
          colorBgElevated: '#1b1f30',
          colorBgLayout: '#0e1018',
          colorBorderSecondary: 'rgba(32, 178, 170, 0.12)',
          colorFillQuaternary: 'rgba(32, 178, 170, 0.06)',
          colorFillSecondary: 'rgba(32, 178, 170, 0.14)',
          colorFillTertiary: 'rgba(32, 178, 170, 0.09)',
          colorPrimaryBg: 'rgba(32, 178, 170, 0.18)',
          colorPrimaryBgHover: 'rgba(32, 178, 170, 0.26)',
          colorPrimaryBorder: 'rgba(32, 178, 170, 0.38)',
          colorPrimaryBorderHover: 'rgba(32, 178, 170, 0.54)',
          controlItemBgActive: 'rgba(32, 178, 170, 0.18)',
          controlItemBgActiveHover: 'rgba(32, 178, 170, 0.26)',
          controlOutline: 'rgba(32, 178, 170, 0.3)',
        }
      : {};

  return {
    ...presetTokens,
    ...(resolvedNeutral &&
      !themePreset && {
        colorBorderSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.3 : 0.18),
        colorFillQuaternary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.14 : 0.06),
        colorFillSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.26 : 0.12),
        colorFillTertiary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.2 : 0.09),
      }),
    ...(resolvedPrimary &&
      !themePreset && {
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
