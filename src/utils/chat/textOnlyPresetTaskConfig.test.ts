import { describe, expect, it } from 'vitest';

import { buildTextOnlyPresetTaskConfig } from './textOnlyPresetTaskConfig';

describe('buildTextOnlyPresetTaskConfig', () => {
  it('should preserve model routing while disabling thinking output', () => {
    expect(
      buildTextOnlyPresetTaskConfig({
        model: 'accounts/fireworks/routers/kimi-k2p5-turbo',
        provider: 'fireworksai',
      }),
    ).toEqual({
      model: 'accounts/fireworks/routers/kimi-k2p5-turbo',
      provider: 'fireworksai',
      thinking: {
        type: 'disabled',
      },
    });
  });
});
