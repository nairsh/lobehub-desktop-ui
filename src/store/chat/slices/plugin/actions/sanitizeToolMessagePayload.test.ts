import { describe, expect, it } from 'vitest';

import { sanitizeToolMessagePayload } from './sanitizeToolMessagePayload';

describe('sanitizeToolMessagePayload', () => {
  it('truncates oversized content', () => {
    const payload = sanitizeToolMessagePayload({
      content: 'x'.repeat(40_000),
    });

    expect(payload.content!.length).toBeLessThan(40_000);
  });

  it('caps oversized plugin state before persistence', () => {
    const payload = sanitizeToolMessagePayload({
      pluginState: {
        stdout: 'x'.repeat(200_000),
      },
    });

    expect(payload.pluginState).toMatchObject({
      stdout: expect.stringContaining('...[truncated]'),
    });
  });
});
