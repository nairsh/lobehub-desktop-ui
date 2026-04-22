import { describe, expect, it } from 'vitest';

import { buildRefineSuggestion } from './refineSuggestion';

describe('buildRefineSuggestion', () => {
  it('should only keep the appended suffix when the rewrite preserves the prompt prefix', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'Fix this sentence',
        rewrittenPrompt: 'Fix this sentence:',
      }),
    ).toEqual({ prefix: 'Fix this sentence', suggestion: ':' });
  });

  it('should return a common prefix and diff suffix when the rewrite diverges mid-text', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'bad sentence',
        rewrittenPrompt: 'better sentence with detail',
      }),
    ).toEqual({ prefix: 'b', suggestion: 'etter sentence with detail' });
  });

  it('should return full rewrite as suggestion when there is no common prefix', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'old text',
        rewrittenPrompt: 'Completely new text',
      }),
    ).toEqual({ prefix: '', suggestion: 'Completely new text' });
  });

  it('should return null when the rewrite matches the current prompt', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'same text',
        rewrittenPrompt: 'same text',
      }),
    ).toBeNull();
  });

  it('should return null when the rewritten prompt is empty', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: 'something',
        rewrittenPrompt: '',
      }),
    ).toBeNull();
  });

  it('should return the full rewrite when the current prompt is empty', () => {
    expect(
      buildRefineSuggestion({
        currentPrompt: '',
        rewrittenPrompt: 'new prompt',
      }),
    ).toEqual({ prefix: '', suggestion: 'new prompt' });
  });
});
