import { neutralColors } from '@lobehub/ui';
import chroma from 'chroma-js';
import { describe, expect, it } from 'vitest';

import {
  createEnhancedThemeTokens,
  createPresetSwatchBackground,
  createThemeSwatchBackground,
  defaultThemeSwatchBackground,
  getThemePreset,
  resolveNeutralThemeColor,
  resolvePrimaryThemeColor,
  themePresetIds,
} from './customTheme';

describe('customTheme', () => {
  it('resolves named theme colors', () => {
    expect(resolvePrimaryThemeColor('magenta')).toBe('#e34ba9');
    // mauve is boosted from Radix's ~3% saturation to ~35% so the hue is clearly visible.
    expect(resolveNeutralThemeColor('mauve')).toBe(
      chroma(neutralColors.mauve).set('hsl.s', 0.35).hex(),
    );
  });

  it('boosts neutral hue saturation across the supported neutral palettes', () => {
    for (const name of ['mauve', 'olive', 'sage', 'sand', 'slate'] as const) {
      const resolved = resolveNeutralThemeColor(name)!;
      expect(chroma(resolved).get('hsl.s')).toBeCloseTo(0.35, 2);
    }
  });

  it('creates visible custom color swatch gradients', () => {
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

  it('provides full light and dark token sets for theme presets', () => {
    expect(themePresetIds).toEqual([
      'graphite',
      'slate',
      'zinc',
      'stone',
      'ivory',
      'ocean',
      'forest',
      'ember',
    ]);

    const lightTokens = createEnhancedThemeTokens({ isDarkMode: false, themePreset: 'ocean' });
    const darkTokens = createEnhancedThemeTokens({ isDarkMode: true, themePreset: 'ocean' });

    expect(lightTokens.colorPrimary).toBe('#0284c7');
    expect(darkTokens.colorPrimary).toBe('#38bdf8');
    expect(lightTokens.colorBgLayout).not.toBe(darkTokens.colorBgLayout);
  });

  it('ignores removed or unknown persisted presets', () => {
    expect(getThemePreset('perplexity')).toBeUndefined();
    expect(
      createEnhancedThemeTokens({ isDarkMode: true, themePreset: 'perplexity' as never }),
    ).toEqual({});
  });

  it('creates solid preset swatches from the preset registry', () => {
    expect(createPresetSwatchBackground('graphite')).toBe('#64748b');
  });
});
