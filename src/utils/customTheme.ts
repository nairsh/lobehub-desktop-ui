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

export const defaultThemeSwatchBackground =
  'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0 45%, rgba(0, 0, 0, 0.06) 45% 55%, rgba(255, 255, 255, 0.94) 55% 100%)';

export const resolvePrimaryThemeColor = (value?: PrimaryColors) =>
  value ? primaryColors[value] : undefined;

export const resolveNeutralThemeColor = (value?: NeutralColors) =>
  value ? neutralColors[value] : undefined;

export const createEnhancedThemeTokens = ({
  isDarkMode,
  neutralColor,
  primaryColor,
}: {
  isDarkMode: boolean;
  neutralColor?: NeutralColors;
  primaryColor?: PrimaryColors;
}) => {
  const resolvedPrimary = resolvePrimaryThemeColor(primaryColor);
  const resolvedNeutral = resolveNeutralThemeColor(neutralColor);

  return {
    ...(resolvedNeutral && {
      colorBorderSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.3 : 0.18),
      colorFillQuaternary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.14 : 0.06),
      colorFillSecondary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.26 : 0.12),
      colorFillTertiary: createAlphaColor(resolvedNeutral, isDarkMode ? 0.2 : 0.09),
    }),
    ...(resolvedPrimary && {
      colorPrimaryBg: createAlphaColor(resolvedPrimary, isDarkMode ? 0.34 : 0.16),
      colorPrimaryBgHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.42 : 0.22),
      colorPrimaryBorder: createAlphaColor(resolvedPrimary, isDarkMode ? 0.48 : 0.28),
      colorPrimaryBorderHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.62 : 0.4),
      controlItemBgActive: createAlphaColor(resolvedPrimary, isDarkMode ? 0.28 : 0.12),
      controlItemBgActiveHover: createAlphaColor(resolvedPrimary, isDarkMode ? 0.36 : 0.18),
      controlOutline: createAlphaColor(resolvedPrimary, isDarkMode ? 0.46 : 0.24),
    }),
  };
};
