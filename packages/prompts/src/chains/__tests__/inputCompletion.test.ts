import { describe, expect, it } from 'vitest';

import { chainInputCompletion } from '../inputCompletion';

describe('chainInputCompletion', () => {
  it('builds an autocomplete prompt for partial words', () => {
    const result = chainInputCompletion('Please hel', '', [
      { content: 'Can you help me debug this API issue?', role: 'user' },
    ]);

    expect(result.max_tokens).toBe(24);
    expect(result.messages?.[0].content).toContain('complete that partial word first');
    expect(result.messages?.[0].content).toContain('"Please hel" → "p me debug this API error"');
    expect(result.messages?.[1].content).toContain('Before cursor: "Please hel"');
  });
});
