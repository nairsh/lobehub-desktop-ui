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
    expect(resolveNeutralThemeColor('mauve')).toBe('#737177');
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
