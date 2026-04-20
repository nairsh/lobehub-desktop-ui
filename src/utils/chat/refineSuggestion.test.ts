import { describe, expect, it } from 'vitest';

import { buildRefineSuggestion } from './refineSuggestion';

describe('buildRefineSuggestion', () => {
  it('should only keep the appended suffix when the rewrite preserves the prompt prefix', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'Fix this sentence',
        rewrittenPrompt: 'Fix this sentence:',
      }),
    ).toBe(':');
  });

  it('should return the full rewrite when it does not extend the existing prompt', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'bad sentence',
        rewrittenPrompt: 'Please rewrite this sentence clearly.',
      }),
    ).toBe('Please rewrite this sentence clearly.');
  });
});
