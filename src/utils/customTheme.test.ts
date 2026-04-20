import { neutralColors } from '@lobehub/ui';
import chroma from 'chroma-js';
import { describe, expect, it } from 'vitest';

import {
  createEnhancedThemeTokens,
  createThemeSwatchBackground,
  defaultThemeSwatchBackground,
  resolveNeutralThemeColor,
  resolvePrimaryThemeColor,
} from './customTheme';

describe('customTheme', () => {
  it('resolves named theme colors', () => {
    expect(resolvePrimaryThemeColor('magenta')).toBe('#e34ba9');
    // mauve is boosted from Radix's ~3% saturation to ~12% so the hue is visible.
    expect(resolveNeutralThemeColor('mauve')).toBe(
      chroma(neutralColors.mauve).set('hsl.s', 0.12).hex(),
    );
  });

  it('boosts neutral hue saturation across the supported neutral palettes', () => {
    for (const name of ['mauve', 'olive', 'sage', 'sand', 'slate'] as const) {
      const resolved = resolveNeutralThemeColor(name)!;
      expect(chroma(resolved).get('hsl.s')).toBeCloseTo(0.12, 2);
    }
  });

  it('creates visible swatch gradients', () => {
    expect(createThemeSwatchBackground('#e34ba9')).toContain('linear-gradient');
    expect(defaultThemeSwatchBackground).toContain('linear-gradient');
  });

  it('creates stronger accent tokens from selected palettes', () => {
    const tokens = createEnhancedThemeTokens({
      isDarkMode: false,
      neutralColor: 'mauve',
      primaryColor: 'magenta',
    });

    expect(tokens.colorPrimaryBg).toBeTruthy();
    expect(tokens.controlItemBgActive).toBeTruthy();
    expect(tokens.colorFillSecondary).toBeTruthy();
    expect(tokens.colorPrimaryBg).not.toBe(tokens.colorPrimaryBgHover);
  });
});
